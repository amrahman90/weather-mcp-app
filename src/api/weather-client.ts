import { z } from "zod/v3";
import { config } from "../../config.js";
import { logger } from "../utils/logger.js";

interface Logger {
  warn: (obj: Record<string, unknown>, msg: string) => void;
  info: (obj: Record<string, unknown>, msg: string) => void;
  debug: (obj: Record<string, unknown>, msg: string) => void;
  error: (obj: Record<string, unknown>, msg: string) => void;
}

let activeLogger: Logger = logger;

export function setLogger(newLogger: Logger): void {
  activeLogger = newLogger;
}

import {
  geocodingResponseSchema,
  geocodingResultSchema,
  openMeteoResponseSchema,
  airQualityResponseSchema,
  type WeatherData,
  type GeocodingResult,
} from "../types/weather.js";

const GEO_URL = `${config.api.openMeteo.geocodingUrl}/search`;
const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout<T>(url: string, options: RequestInit = {}, schema: z.ZodSchema<T>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const rawData = await response.json();
    const parsed = schema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(`Invalid API response: ${parsed.error.message}`);
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchGeocoding(location: string): Promise<GeocodingResult> {
  const data = await fetchWithTimeout(
    `${GEO_URL}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
    {},
    geocodingResponseSchema
  );
  
  if (!data.results || data.results.length === 0) {
    throw new Error(`Location not found: ${location}`);
  }
  
  return geocodingResultSchema.parse(data.results[0]);
}

export async function fetchWeatherData(lat: number, lon: number, unit: "celsius" | "fahrenheit"): Promise<WeatherData> {
  const tempUnit = unit === "celsius" ? "celsius" : "fahrenheit";
  const windUnit = unit === "celsius" ? "kmh" : "mph";
  
  const url = new URL(`${config.api.openMeteo.baseUrl}/v1/forecast`);
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m");
  url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,sunrise,sunset");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("temperature_unit", tempUnit);
  url.searchParams.set("wind_speed_unit", windUnit);
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timeformat", "unixtime");
  
  const data = await fetchWithTimeout(url.toString(), {}, openMeteoResponseSchema);
  
  const now = new Date();
  const currentHourTimestamp = Math.floor(now.getTime() / 1000 / 3600) * 3600;
  
  let actualCurrentIndex = 0;
  let minDiff = Infinity;
  
  for (let i = 0; i < data.hourly.time.length; i++) {
    const diff = Math.abs(data.hourly.time[i] - currentHourTimestamp);
    if (diff < minDiff) {
      minDiff = diff;
      actualCurrentIndex = i;
    }
  }
  
  const hourlyInterval = 3600;
  const hourlyStart = data.hourly.time[0];
  
  return {
    current: {
      temperature: data.current.temperature_2m,
      apparent_temperature: data.current.apparent_temperature,
      relative_humidity_2m: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      weather_code: data.current.weather_code,
      wind_speed_10m: data.current.wind_speed_10m,
      wind_direction_10m: data.current.wind_direction_10m,
    },
    hourly: Array.from({ length: Math.min(24, data.hourly.time.length - actualCurrentIndex) }, (_, i) => ({
      time: new Date((hourlyStart + (actualCurrentIndex + i) * hourlyInterval) * 1000).toISOString(),
      temperature_2m: data.hourly.temperature_2m[actualCurrentIndex + i],
      weather_code: data.hourly.weather_code[actualCurrentIndex + i],
      precipitation_probability: data.hourly.precipitation_probability[actualCurrentIndex + i],
    })),
    daily: Array.from({ length: data.daily.time.length }, (_, i) => ({
      time: new Date(data.daily.time[i] * 1000).toISOString(),
      temperature_2m_max: data.daily.temperature_2m_max[i],
      temperature_2m_min: data.daily.temperature_2m_min[i],
      weather_code: data.daily.weather_code[i],
      precipitation_sum: data.daily.precipitation_sum[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
    })),
    location: {
      name: data.timezone || "Unknown",
      country: "",
      latitude: lat,
      longitude: lon,
      timezone: data.timezone || "UTC",
    },
  };
}

export async function fetchAirQualityData(lat: number, lon: number): Promise<WeatherData["airQuality"] | undefined> {
  try {
    const url = new URL(`${config.api.openMeteo.airQualityUrl}/air-quality`);
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lon.toString());
    url.searchParams.set("current", "us_aqi,pm2_5,pm10,ozone");
    
    const data = await fetchWithTimeout(url.toString(), {}, airQualityResponseSchema);
    
    if (data.current && data.current.us_aqi != null) {
      return {
        us_aqi: data.current.us_aqi,
        pm2_5: data.current.pm2_5 ?? undefined,
        pm10: data.current.pm10 ?? undefined,
        ozone: data.current.ozone ?? undefined,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    activeLogger.warn({ error: message, lat, lon }, "Air quality fetch failed");
  }
  return undefined;
}

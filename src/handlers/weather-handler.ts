import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getWeatherInputSchema } from "../types/weather.js";
import { rateLimiter } from "../../rate-limiter.js";
import { config } from "../../config.js";
import { fetchGeocoding, fetchWeatherData, fetchAirQualityData } from "../api/weather-client.js";
import { formatWeatherText } from "../services/weather-formatter.js";

interface GetWeatherParams {
  location: string;
  unit: "celsius" | "fahrenheit";
}

function parseParams(params: unknown): GetWeatherParams {
  const parsed = getWeatherInputSchema.parse(params);
  return {
    location: parsed.location,
    unit: parsed.unit ?? "celsius",
  };
}

export async function handleGetWeather(params: unknown): Promise<CallToolResult> {
  try {
    const rateCheck = rateLimiter.check();
    if (!rateCheck.allowed) {
      return {
        content: [{
          type: "text",
          text: `Rate limit exceeded. Please try again in ${rateCheck.retryAfter} seconds.\n\nUsage: Hourly ${rateCheck.remaining.hourly}/${config.rateLimit.hourly}, Daily ${rateCheck.remaining.daily}/${config.rateLimit.daily}, Monthly ${rateCheck.remaining.monthly}/${config.rateLimit.monthly}`
        }],
        isError: true,
      };
    }

    const { location, unit } = parseParams(params);
    
    const geo = await fetchGeocoding(location);
    const weather = await fetchWeatherData(geo.latitude, geo.longitude, unit);
    weather.location.name = geo.name;
    weather.location.country = geo.country;
    
    const airQuality = await fetchAirQualityData(geo.latitude, geo.longitude);
    if (airQuality) {
      weather.airQuality = airQuality;
    }
    
    const textResponse = formatWeatherText(weather, unit);
    
    rateLimiter.increment();
    
    return {
      content: [{ type: "text", text: textResponse }],
      structuredContent: weather,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
}

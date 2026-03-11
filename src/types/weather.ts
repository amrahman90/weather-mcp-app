import { z } from "zod/v3";

export const geocodingResultSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  name: z.string(),
  country: z.string(),
  admin1: z.string().optional(),
});

export type GeocodingResult = z.infer<typeof geocodingResultSchema>;

export const geocodingResponseSchema = z.object({
  results: z.array(geocodingResultSchema).optional(),
});

export type GeocodingResponse = z.infer<typeof geocodingResponseSchema>;

export const openMeteoCurrentSchema = z.object({
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  apparent_temperature: z.number(),
  precipitation: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
});

export const openMeteoHourlySchema = z.object({
  time: z.array(z.number()),
  temperature_2m: z.array(z.number()),
  weather_code: z.array(z.number()),
  precipitation_probability: z.array(z.number()),
});

export const openMeteoDailySchema = z.object({
  time: z.array(z.number()),
  temperature_2m_max: z.array(z.number()),
  temperature_2m_min: z.array(z.number()),
  weather_code: z.array(z.number()),
  precipitation_sum: z.array(z.number()),
  sunrise: z.array(z.union([z.string(), z.number()])),
  sunset: z.array(z.union([z.string(), z.number()])),
});

export const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  hourly: openMeteoHourlySchema,
  daily: openMeteoDailySchema,
  current: openMeteoCurrentSchema,
  current_units: z.record(z.string(), z.string()),
});

export type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;

export const airQualityCurrentSchema = z.object({
  us_aqi: z.number().nullable(),
  pm2_5: z.number().nullable(),
  pm10: z.number().nullable(),
  ozone: z.number().nullable(),
});

export const airQualityResponseSchema = z.object({
  current: airQualityCurrentSchema.nullable(),
});

export type AirQualityResponse = z.infer<typeof airQualityResponseSchema>;

export const weatherDataSchema = z.object({
  current: z.object({
    temperature: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
    wind_direction_10m: z.number(),
  }),
  hourly: z.array(z.object({
    time: z.string(),
    temperature_2m: z.number(),
    weather_code: z.number(),
    precipitation_probability: z.number(),
  })),
  daily: z.array(z.object({
    time: z.string(),
    temperature_2m_max: z.number(),
    temperature_2m_min: z.number(),
    weather_code: z.number(),
    precipitation_sum: z.number(),
    sunrise: z.union([z.string(), z.number()]),
    sunset: z.union([z.string(), z.number()]),
  })),
  location: z.object({
    name: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }),
  airQuality: z.object({
    us_aqi: z.number(),
    pm2_5: z.number().optional(),
    pm10: z.number().optional(),
    ozone: z.number().optional(),
  }).optional(),
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

export const getWeatherInputSchema = z.object({
  location: z.string().min(1).max(200).describe("City name (e.g., 'London') or zip code (e.g., '10001,US')"),
  unit: z.enum(["celsius", "fahrenheit"]).default("celsius").describe("Temperature unit"),
});

export type GetWeatherInput = z.infer<typeof getWeatherInputSchema>;

export const weatherToolOutputSchema = weatherDataSchema;

export type WeatherToolOutput = z.infer<typeof weatherToolOutputSchema>;

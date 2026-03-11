export const config = {
  app: {
    name: "Weather MCP App",
    version: "1.0.0",
  },
  api: {
    openMeteo: {
      baseUrl: process.env.WEATHER_API_URL || "https://api.open-meteo.com",
      geocodingUrl: process.env.GEOCODING_API_URL || "https://geocoding-api.open-meteo.com/v1",
      airQualityUrl: process.env.AIR_QUALITY_API_URL || "https://air-quality-api.open-meteo.com/v1",
    },
  },
  rateLimit: {
    daily: 1000,
    hourly: 100,
    monthly: 30000,
    windowMs: {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    },
  },
  cache: {
    weatherTtlMinutes: 30,
    geocodingTtlMinutes: 60 * 24,
  },
} as const;

export type Config = typeof config;

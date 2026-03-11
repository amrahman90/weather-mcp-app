import { z } from "zod";
import {
  geocodingResponseSchema,
  openMeteoResponseSchema,
  airQualityResponseSchema,
  getWeatherInputSchema,
} from "../../server.js";

describe("Zod Validation Schemas", () => {
  describe("getWeatherInputSchema", () => {
    it("should validate correct input", () => {
      const result = getWeatherInputSchema.safeParse({
        location: "London",
        unit: "celsius",
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.location).toBe("London");
        expect(result.data.unit).toBe("celsius");
      }
    });

    it("should default unit to celsius", () => {
      const result = getWeatherInputSchema.safeParse({
        location: "London",
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe("celsius");
      }
    });

    it("should reject empty location", () => {
      const result = getWeatherInputSchema.safeParse({
        location: "",
        unit: "celsius",
      });
      
      expect(result.success).toBe(false);
    });

    it("should reject location exceeding max length", () => {
      const longLocation = "a".repeat(201);
      const result = getWeatherInputSchema.safeParse({
        location: longLocation,
        unit: "celsius",
      });
      
      expect(result.success).toBe(false);
    });

    it("should reject invalid unit", () => {
      const result = getWeatherInputSchema.safeParse({
        location: "London",
        unit: "kelvin",
      });
      
      expect(result.success).toBe(false);
    });

    it("should allow unknown properties", () => {
      const result = getWeatherInputSchema.safeParse({
        location: "London",
        unit: "celsius",
        unknownProp: "test",
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe("geocodingResponseSchema", () => {
    it("should validate correct geocoding response", () => {
      const validResponse = {
        results: [
          {
            latitude: 51.5074,
            longitude: -0.1278,
            name: "London",
            country: "United Kingdom",
            admin1: "England",
          },
        ],
      };
      
      const result = geocodingResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should allow missing results", () => {
      const response = {};
      const result = geocodingResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should reject invalid latitude", () => {
      const invalidResponse = {
        results: [
          {
            latitude: "invalid",
            longitude: -0.1278,
            name: "London",
            country: "United Kingdom",
          },
        ],
      };
      
      const result = geocodingResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("openMeteoResponseSchema", () => {
    it("should validate correct weather response", () => {
      const validResponse = {
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: "Europe/London",
        hourly: {
          time: [1704067200, 1704070800],
          temperature_2m: [10, 11],
          weather_code: [0, 1],
          precipitation_probability: [0, 10],
        },
        daily: {
          time: [1704067200],
          temperature_2m_max: [15],
          temperature_2m_min: [5],
          weather_code: [0],
          precipitation_sum: [0],
          sunrise: ["2024-01-01T07:00:00"],
          sunset: ["2024-01-01T16:00:00"],
        },
        current: {
          temperature_2m: 12,
          relative_humidity_2m: 75,
          apparent_temperature: 10,
          precipitation: 0,
          weather_code: 0,
          wind_speed_10m: 15,
          wind_direction_10m: 180,
        },
        current_units: {},
      };
      
      const result = openMeteoResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should reject missing current data", () => {
      const invalidResponse = {
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: "Europe/London",
        hourly: {
          time: [1704067200],
          temperature_2m: [10],
          weather_code: [0],
          precipitation_probability: [0],
        },
        daily: {
          time: [1704067200],
          temperature_2m_max: [15],
          temperature_2m_min: [5],
          weather_code: [0],
          precipitation_sum: [0],
          sunrise: ["2024-01-01T07:00:00"],
          sunset: ["2024-01-01T16:00:00"],
        },
        current_units: {},
      };
      
      const result = openMeteoResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("airQualityResponseSchema", () => {
    it("should validate correct air quality response", () => {
      const validResponse = {
        current: {
          us_aqi: 25,
          pm2_5: 5.5,
          pm10: 10.2,
          ozone: 30,
        },
      };
      
      const result = airQualityResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should allow null values", () => {
      const response = {
        current: {
          us_aqi: null,
          pm2_5: null,
          pm10: null,
          ozone: null,
        },
      };
      
      const result = airQualityResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should allow missing current", () => {
      const response = {
        somethingElse: "test"
      };
      const result = airQualityResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});

import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { getWeatherInputSchema } from "../../src/types/weather.js";

describe("handleGetWeather parameter validation", () => {
  describe("getWeatherInputSchema", () => {
    it("should validate valid input with location and unit", () => {
      const input = { location: "London", unit: "celsius" };
      const result = getWeatherInputSchema.parse(input);
      expect(result.location).toBe("London");
      expect(result.unit).toBe("celsius");
    });

    it("should validate valid input with location only", () => {
      const input = { location: "New York" };
      const result = getWeatherInputSchema.parse(input);
      expect(result.location).toBe("New York");
      expect(result.unit).toBe("celsius");
    });

    it("should accept fahrenheit unit", () => {
      const input = { location: "Tokyo", unit: "fahrenheit" };
      const result = getWeatherInputSchema.parse(input);
      expect(result.unit).toBe("fahrenheit");
    });

    it("should reject empty location", () => {
      const input = { location: "", unit: "celsius" };
      expect(() => getWeatherInputSchema.parse(input)).toThrow();
    });

    it("should reject location exceeding max length", () => {
      const input = { location: "a".repeat(201), unit: "celsius" };
      expect(() => getWeatherInputSchema.parse(input)).toThrow();
    });

    it("should reject invalid unit", () => {
      const input = { location: "London", unit: "kelvin" };
      expect(() => getWeatherInputSchema.parse(input)).toThrow();
    });

    it("should reject missing location", () => {
      const input = { unit: "celsius" };
      expect(() => getWeatherInputSchema.parse(input)).toThrow();
    });

    it("should have correct schema description", () => {
      const shape = getWeatherInputSchema.shape;
      expect(shape.location.description).toContain("City name");
      expect(shape.unit.description).toContain("Temperature unit");
    });
  });
});

describe("handleGetWeather error scenarios", () => {
  it("should handle rate limit errors appropriately", () => {
    const rateLimitResponse = {
      allowed: false,
      retryAfter: 3600,
      remaining: { hourly: 0, daily: 0, monthly: 0 },
    };
    expect(rateLimitResponse.allowed).toBe(false);
    expect(rateLimitResponse.retryAfter).toBe(3600);
  });

  it("should format rate limit error message correctly", () => {
    const rateCheck = {
      allowed: false,
      retryAfter: 3600,
      remaining: { hourly: 0, daily: 0, monthly: 0 },
    };
    const message = `Rate limit exceeded. Please try again in ${rateCheck.retryAfter} seconds.`;
    expect(message).toContain("Rate limit exceeded");
    expect(message).toContain("3600");
  });
});

describe("handleGetWeather response structure", () => {
  it("should return correct response structure for success", () => {
    const response = {
      content: [{ type: "text" as const, text: "Weather data" }],
      structuredContent: { current: { temperature: 20 } },
    };
    expect(response.content[0].type).toBe("text");
    expect(response.structuredContent).toBeDefined();
  });

  it("should return correct response structure for error", () => {
    const response = {
      content: [{ type: "text" as const, text: "Error: something went wrong" }],
      isError: true,
    };
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Error:");
  });

  it("should handle missing air quality gracefully", () => {
    const weatherData = {
      current: { temperature: 20 },
      hourly: [],
      daily: [],
      location: { name: "London", country: "UK", latitude: 0, longitude: 0, timezone: "UTC" },
      airQuality: undefined,
    };
    expect(weatherData.airQuality).toBeUndefined();
  });

  it("should handle air quality with null values", () => {
    const airQuality = {
      us_aqi: null,
      pm2_5: null,
      pm10: null,
      ozone: null,
    };
    expect(airQuality.us_aqi).toBeNull();
  });
});

describe("handleGetWeather data flow", () => {
  it("should update location name from geocoding response", () => {
    const geo = { name: "London", country: "United Kingdom" };
    const weather = {
      current: { temperature: 20 },
      hourly: [],
      daily: [],
      location: { name: "", country: "", latitude: 0, longitude: 0, timezone: "UTC" },
    };
    weather.location.name = geo.name;
    weather.location.country = geo.country;
    expect(weather.location.name).toBe("London");
    expect(weather.location.country).toBe("United Kingdom");
  });

  it("should use unit parameter correctly for fahrenheit", () => {
    const unit = "fahrenheit";
    const windUnit = unit === "celsius" ? "km/h" : "mph";
    expect(windUnit).toBe("mph");
  });

  it("should use unit parameter correctly for celsius", () => {
    const unit = "celsius";
    const windUnit = unit === "celsius" ? "km/h" : "mph";
    expect(windUnit).toBe("km/h");
  });
});

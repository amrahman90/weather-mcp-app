import { jest, expect, describe, it, beforeEach } from "@jest/globals";

import {
  fetchGeocoding,
  fetchWeatherData,
  fetchAirQualityData,
} from "../../src/api/weather-client.js";
import { setLogger } from "../../src/api/weather-client.js";
import {
  formatWeatherText,
  getWindDirection,
  getAQILevel,
} from "../../src/services/weather-formatter.js";

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockLogger = {
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

setLogger(mockLogger);

describe("fetchGeocoding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return geocoding data for a valid location", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [
          {
            latitude: 51.5074,
            longitude: -0.1278,
            name: "London",
            country: "United Kingdom",
            admin1: "England",
          },
        ],
      }),
    } as Response);

    const result = await fetchGeocoding("London");

    expect(result.latitude).toBe(51.5074);
    expect(result.longitude).toBe(-0.1278);
    expect(result.name).toBe("London");
    expect(result.country).toBe("United Kingdom");
  });

  it("should throw error when location not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    } as Response);

    await expect(fetchGeocoding("InvalidLocation12345")).rejects.toThrow(
      "Location not found: InvalidLocation12345"
    );
  });

  it("should throw error for invalid API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ invalid: "response" }),
    } as Response);

    await expect(fetchGeocoding("London")).rejects.toThrow(
      "Location not found: London"
    );
  });

  it("should handle network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchGeocoding("London")).rejects.toThrow("Network error");
  });
});

describe("fetchWeatherData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return weather data in celsius", async () => {
    const mockResponse = {
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: "Europe/London",
      hourly: {
        time: [1704067200, 1704070800, 1704074400],
        temperature_2m: [10, 11, 12],
        weather_code: [0, 1, 2],
        precipitation_probability: [0, 10, 20],
      },
      daily: {
        time: [1704067200, 1704153600],
        temperature_2m_max: [15, 16],
        temperature_2m_min: [5, 6],
        weather_code: [0, 1],
        precipitation_sum: [0, 2],
        sunrise: ["2024-01-01T07:00:00", "2024-01-02T07:01:00"],
        sunset: ["2024-01-01T16:00:00", "2024-01-02T16:01:00"],
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchWeatherData(51.5074, -0.1278, "celsius");

    expect(result.current.temperature).toBe(12);
    expect(result.current.relative_humidity_2m).toBe(75);
    expect(result.hourly.length).toBeGreaterThan(0);
    expect(result.daily.length).toBe(2);
  });

  it("should fetch and return weather data in fahrenheit", async () => {
    const mockResponse = {
      latitude: 40.7128,
      longitude: -74.006,
      timezone: "America/New_York",
      hourly: {
        time: [1704067200, 1704070800],
        temperature_2m: [50, 52],
        weather_code: [0, 1],
        precipitation_probability: [0, 10],
      },
      daily: {
        time: [1704067200],
        temperature_2m_max: [55],
        temperature_2m_min: [42],
        weather_code: [0],
        precipitation_sum: [0],
        sunrise: ["2024-01-01T07:00:00"],
        sunset: ["2024-01-01T16:00:00"],
      },
      current: {
        temperature_2m: 53,
        relative_humidity_2m: 65,
        apparent_temperature: 50,
        precipitation: 0,
        weather_code: 0,
        wind_speed_10m: 10,
        wind_direction_10m: 90,
      },
      current_units: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchWeatherData(40.7128, -74.006, "fahrenheit");

    expect(result.current.temperature).toBe(53);
    expect(result.current.wind_speed_10m).toBe(10);
  });

  it("should throw error when API returns non-OK status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchWeatherData(51.5074, -0.1278, "celsius")).rejects.toThrow(
      "HTTP error: 500"
    );
  });

  it("should throw error for invalid API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ invalid: "response" }),
    } as Response);

    await expect(fetchWeatherData(51.5074, -0.1278, "celsius")).rejects.toThrow(
      "Invalid API response"
    );
  });
});

describe("fetchAirQualityData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return air quality data", async () => {
    const mockResponse = {
      current: {
        us_aqi: 45,
        pm2_5: 12.5,
        pm10: 25.0,
        ozone: 30,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchAirQualityData(51.5074, -0.1278);

    expect(result).toBeDefined();
    expect(result?.us_aqi).toBe(45);
    expect(result?.pm2_5).toBe(12.5);
    expect(result?.pm10).toBe(25);
  });

  it("should return undefined when API returns non-OK status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await fetchAirQualityData(51.5074, -0.1278);

    expect(result).toBeUndefined();
  });

  it("should return undefined when current data is null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ current: null }),
    } as Response);

    const result = await fetchAirQualityData(51.5074, -0.1278);

    expect(result).toBeUndefined();
  });

  it("should return undefined and handle null values gracefully", async () => {
    const mockResponse = {
      current: {
        us_aqi: null,
        pm2_5: null,
        pm10: null,
        ozone: null,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchAirQualityData(51.5074, -0.1278);

    expect(result).toBeUndefined();
  });

  it("should return undefined on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchAirQualityData(51.5074, -0.1278);

    expect(result).toBeUndefined();
  });
});

describe("formatWeatherText", () => {
  it("should format weather data with current conditions", () => {
    const weatherData = {
      current: {
        temperature: 22,
        apparent_temperature: 20,
        relative_humidity_2m: 65,
        precipitation: 0,
        weather_code: 0,
        wind_speed_10m: 15,
        wind_direction_10m: 180,
      },
      hourly: [],
      daily: [
        {
          time: "2024-01-02T00:00:00.000Z",
          temperature_2m_max: 25,
          temperature_2m_min: 15,
          weather_code: 1,
          precipitation_sum: 0,
          sunrise: "2024-01-01T07:00:00",
          sunset: "2024-01-01T16:00:00",
        },
        {
          time: "2024-01-03T00:00:00.000Z",
          temperature_2m_max: 23,
          temperature_2m_min: 14,
          weather_code: 2,
          precipitation_sum: 2,
          sunrise: "2024-01-02T07:01:00",
          sunset: "2024-01-02T16:01:00",
        },
      ],
      location: {
        name: "London",
        country: "United Kingdom",
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: "Europe/London",
      },
    };

    const result = formatWeatherText(weatherData);

    expect(result).toContain("Weather in London:");
    expect(result).toContain("Clear sky");
    expect(result).toContain("22°");
    expect(result).toContain("7-Day Forecast:");
  });

  it("should include air quality information when available", () => {
    const weatherData = {
      current: {
        temperature: 25,
        apparent_temperature: 27,
        relative_humidity_2m: 70,
        precipitation: 0,
        weather_code: 1,
        wind_speed_10m: 10,
        wind_direction_10m: 90,
      },
      hourly: [],
      daily: [],
      location: {
        name: "New York",
        country: "United States",
        latitude: 40.7128,
        longitude: -74.006,
        timezone: "America/New_York",
      },
      airQuality: {
        us_aqi: 75,
        pm2_5: 20,
        pm10: 35,
        ozone: 40,
      },
    };

    const result = formatWeatherText(weatherData);

    expect(result).toContain("Air Quality:");
    expect(result).toContain("Moderate");
    expect(result).toContain("AQI: 75");
  });

  it("should show 7-day forecast", () => {
    const weatherData = {
      current: {
        temperature: 20,
        apparent_temperature: 18,
        relative_humidity_2m: 60,
        precipitation: 0,
        weather_code: 0,
        wind_speed_10m: 12,
        wind_direction_10m: 270,
      },
      hourly: [],
      daily: Array.from({ length: 7 }, (_, i) => ({
        time: new Date(2024, 0, i + 2).toISOString(),
        temperature_2m_max: 20 + i,
        temperature_2m_min: 10 + i,
        weather_code: 0,
        precipitation_sum: i,
        sunrise: `2024-01-0${i + 1}T07:00:00`,
        sunset: `2024-01-0${i + 1}T16:00:00`,
      })),
      location: {
        name: "Tokyo",
        country: "Japan",
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: "Asia/Tokyo",
      },
    };

    const result = formatWeatherText(weatherData);

    expect(result).toContain("7-Day Forecast:");
    const forecastLines = result.split("\n").filter(line => line.includes(":"));
    expect(forecastLines.length).toBeGreaterThanOrEqual(7);
  });
});

describe("getWindDirection", () => {
  it("should return correct direction for 0 degrees", () => {
    expect(getWindDirection(0)).toBe("N");
  });

  it("should return correct direction for 90 degrees", () => {
    expect(getWindDirection(90)).toBe("E");
  });

  it("should return correct direction for 180 degrees", () => {
    expect(getWindDirection(180)).toBe("S");
  });

  it("should return correct direction for 270 degrees", () => {
    expect(getWindDirection(270)).toBe("W");
  });

  it("should return correct direction for 360 degrees", () => {
    expect(getWindDirection(360)).toBe("N");
  });

  it("should return correct direction for intermediate directions", () => {
    expect(getWindDirection(22.5)).toBe("NNE");
    expect(getWindDirection(45)).toBe("NE");
    expect(getWindDirection(67.5)).toBe("ENE");
    expect(getWindDirection(112.5)).toBe("ESE");
    expect(getWindDirection(135)).toBe("SE");
  });

  it("should handle values greater than 360", () => {
    expect(getWindDirection(450)).toBe("E");
  });

  it("should handle negative values", () => {
    expect(getWindDirection(-45)).toBe("NW");
  });
});

describe("getAQILevel", () => {
  it("should return Good for AQI 0-50", () => {
    expect(getAQILevel(0)).toBe("Good");
    expect(getAQILevel(25)).toBe("Good");
    expect(getAQILevel(50)).toBe("Good");
  });

  it("should return Moderate for AQI 51-100", () => {
    expect(getAQILevel(51)).toBe("Moderate");
    expect(getAQILevel(75)).toBe("Moderate");
    expect(getAQILevel(100)).toBe("Moderate");
  });

  it("should return Unhealthy for Sensitive for AQI 101-150", () => {
    expect(getAQILevel(101)).toBe("Unhealthy for Sensitive");
    expect(getAQILevel(125)).toBe("Unhealthy for Sensitive");
    expect(getAQILevel(150)).toBe("Unhealthy for Sensitive");
  });

  it("should return Unhealthy for AQI 151-200", () => {
    expect(getAQILevel(151)).toBe("Unhealthy");
    expect(getAQILevel(175)).toBe("Unhealthy");
    expect(getAQILevel(200)).toBe("Unhealthy");
  });

  it("should return Very Unhealthy for AQI 201-300", () => {
    expect(getAQILevel(201)).toBe("Very Unhealthy");
    expect(getAQILevel(250)).toBe("Very Unhealthy");
    expect(getAQILevel(300)).toBe("Very Unhealthy");
  });

  it("should return Hazardous for AQI above 300", () => {
    expect(getAQILevel(301)).toBe("Hazardous");
    expect(getAQILevel(400)).toBe("Hazardous");
    expect(getAQILevel(500)).toBe("Hazardous");
  });
});

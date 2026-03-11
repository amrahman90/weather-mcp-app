import { config } from "../../config.js";

describe("config", () => {
  it("should have valid rate limit configuration", () => {
    expect(config.rateLimit.daily).toBeGreaterThan(0);
    expect(config.rateLimit.hourly).toBeGreaterThan(0);
    expect(config.rateLimit.monthly).toBeGreaterThan(0);
    
    expect(config.rateLimit.daily).toBeGreaterThan(config.rateLimit.hourly);
    expect(config.rateLimit.monthly).toBeGreaterThan(config.rateLimit.daily);
  });

  it("should have valid window configurations", () => {
    expect(config.rateLimit.windowMs.hourly).toBeGreaterThan(0);
    expect(config.rateLimit.windowMs.daily).toBeGreaterThan(0);
    expect(config.rateLimit.windowMs.monthly).toBeGreaterThan(0);
    
    expect(config.rateLimit.windowMs.daily).toBeGreaterThan(config.rateLimit.windowMs.hourly);
    expect(config.rateLimit.windowMs.monthly).toBeGreaterThan(config.rateLimit.windowMs.daily);
  });

  it("should have valid API URLs", () => {
    expect(config.api.openMeteo.baseUrl).toContain("open-meteo.com");
    expect(config.api.openMeteo.geocodingUrl).toContain("open-meteo.com");
    expect(config.api.openMeteo.airQualityUrl).toContain("open-meteo.com");
  });

  it("should have valid cache TTL configuration", () => {
    expect(config.cache.weatherTtlMinutes).toBeGreaterThan(0);
    expect(config.cache.geocodingTtlMinutes).toBeGreaterThan(0);
  });

  it("should have valid app configuration", () => {
    expect(config.app.name).toBeTruthy();
    expect(config.app.version).toBeTruthy();
  });
});

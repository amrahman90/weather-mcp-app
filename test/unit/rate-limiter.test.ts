import { RateLimiter } from "../../rate-limiter.js";
import { config } from "../../config.js";

function createTestRateLimiter(): RateLimiter {
  return new RateLimiter();
}

describe("RateLimiter", () => {
  describe("check()", () => {
    it("should allow requests within limits", () => {
      const limiter = createTestRateLimiter();
      const result = limiter.check();
      
      expect(result.allowed).toBe(true);
      expect(result.remaining.hourly).toBe(config.rateLimit.hourly);
      expect(result.remaining.daily).toBe(config.rateLimit.daily);
      expect(result.remaining.monthly).toBe(config.rateLimit.monthly);
    });

    it("should return correct remaining counts after increment", () => {
      const limiter = createTestRateLimiter();
      limiter.increment();
      
      const result = limiter.check();
      
      expect(result.allowed).toBe(true);
      expect(result.remaining.hourly).toBe(config.rateLimit.hourly - 1);
      expect(result.remaining.daily).toBe(config.rateLimit.daily - 1);
      expect(result.remaining.monthly).toBe(config.rateLimit.monthly - 1);
    });
  });

  describe("increment()", () => {
    it("should increment all counters", () => {
      const limiter = createTestRateLimiter();
      
      limiter.increment();
      limiter.increment();
      limiter.increment();
      
      const stats = limiter.getStats();
      expect(stats.hourly).toBe(3);
      expect(stats.daily).toBe(3);
      expect(stats.monthly).toBe(3);
    });
  });

  describe("rate limiting", () => {
    it("should block when hourly limit is reached", () => {
      const limiter = createTestRateLimiter();
      
      for (let i = 0; i < config.rateLimit.hourly; i++) {
        limiter.increment();
      }
      
      const result = limiter.check();
      
      expect(result.allowed).toBe(false);
      expect(result.remaining.hourly).toBeLessThanOrEqual(0);
      expect(result.retryAfter).toBeDefined();
    });

    it("should block when daily limit is reached", () => {
      const limiter = createTestRateLimiter();
      
      for (let i = 0; i < config.rateLimit.daily; i++) {
        limiter.increment();
      }
      
      const result = limiter.check();
      
      expect(result.allowed).toBe(false);
      expect(result.remaining.daily).toBeLessThanOrEqual(0);
    });

    it("should block when monthly limit is reached", () => {
      const limiter = createTestRateLimiter();
      
      for (let i = 0; i < config.rateLimit.monthly; i++) {
        limiter.increment();
      }
      
      const result = limiter.check();
      
      expect(result.allowed).toBe(false);
      expect(result.remaining.monthly).toBeLessThanOrEqual(0);
    });
  });

  describe("getStats()", () => {
    it("should return current counts and limits", () => {
      const limiter = createTestRateLimiter();
      limiter.increment();
      limiter.increment();
      
      const stats = limiter.getStats();
      
      expect(stats.hourly).toBe(2);
      expect(stats.daily).toBe(2);
      expect(stats.monthly).toBe(2);
      expect(stats.limits).toEqual(config.rateLimit);
    });
  });
});

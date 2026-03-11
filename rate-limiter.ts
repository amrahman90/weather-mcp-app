import { config } from "./config.js";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitStats {
  hourly: RateLimitRecord;
  daily: RateLimitRecord;
  monthly: RateLimitRecord;
}

export class RateLimiter {
  private stats: RateLimitStats = {
    hourly: { count: 0, resetAt: this.getNextReset(config.rateLimit.windowMs.hourly) },
    daily: { count: 0, resetAt: this.getNextReset(config.rateLimit.windowMs.daily) },
    monthly: { count: 0, resetAt: this.getNextReset(config.rateLimit.windowMs.monthly) },
  };

  private getNextReset(windowMs: number): number {
    return Date.now() + windowMs;
  }

  private resetIfNeeded(record: RateLimitRecord, windowMs: number): void {
    if (Date.now() >= record.resetAt) {
      record.count = 0;
      record.resetAt = this.getNextReset(windowMs);
    }
  }

  check(): { allowed: boolean; remaining: { hourly: number; daily: number; monthly: number }; retryAfter?: number } {
    this.resetIfNeeded(this.stats.hourly, config.rateLimit.windowMs.hourly);
    this.resetIfNeeded(this.stats.daily, config.rateLimit.windowMs.daily);
    this.resetIfNeeded(this.stats.monthly, config.rateLimit.windowMs.monthly);

    const remainingHourly = config.rateLimit.hourly - this.stats.hourly.count;
    const remainingDaily = config.rateLimit.daily - this.stats.daily.count;
    const remainingMonthly = config.rateLimit.monthly - this.stats.monthly.count;

    if (remainingHourly <= 0 || remainingDaily <= 0 || remainingMonthly <= 0) {
      const earliestReset = Math.min(
        this.stats.hourly.resetAt,
        this.stats.daily.resetAt,
        this.stats.monthly.resetAt
      );
      return {
        allowed: false,
        remaining: { hourly: remainingHourly, daily: remainingDaily, monthly: remainingMonthly },
        retryAfter: Math.ceil((earliestReset - Date.now()) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: { hourly: remainingHourly, daily: remainingDaily, monthly: remainingMonthly },
    };
  }

  increment(): void {
    this.resetIfNeeded(this.stats.hourly, config.rateLimit.windowMs.hourly);
    this.resetIfNeeded(this.stats.daily, config.rateLimit.windowMs.daily);
    this.resetIfNeeded(this.stats.monthly, config.rateLimit.windowMs.monthly);

    this.stats.hourly.count++;
    this.stats.daily.count++;
    this.stats.monthly.count++;
  }

  getStats(): { hourly: number; daily: number; monthly: number; limits: typeof config.rateLimit } {
    this.resetIfNeeded(this.stats.hourly, config.rateLimit.windowMs.hourly);
    this.resetIfNeeded(this.stats.daily, config.rateLimit.windowMs.daily);
    this.resetIfNeeded(this.stats.monthly, config.rateLimit.windowMs.monthly);

    return {
      hourly: this.stats.hourly.count,
      daily: this.stats.daily.count,
      monthly: this.stats.monthly.count,
      limits: config.rateLimit,
    };
  }
}

export const rateLimiter = new RateLimiter();

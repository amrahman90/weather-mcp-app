# ADR-003: Bug Fixes and Improvements

## Status

Accepted

## Context

During code review, several issues were identified that affected correctness and user experience.

### Issues Identified

1. **Hourly Index Calculation**: Code used `find()` to get first hourly data past current time, but returned wrong results when hourly data started after current time
2. **Wind Speed Unit Mismatch**: `formatWeatherText` always showed km/h regardless of user's unit preference
3. **AQI Silent Failures**: Air quality API failures were caught but not logged, making debugging difficult
4. **Frontend Stale Data**: When weather fetch failed, old data remained displayed
5. **Rate Limiter Placement**: Counter incremented before response, potentially counting failed requests
6. **AQI Data Quality**: Nullish values coerced to 0 instead of undefined, misleading users

## Decision

### 1. Hourly Index Calculation

Find the closest hourly timestamp to current time, not just the first one past:

```typescript
// Before (wrong)
const index = hourlyData.findIndex(h => new Date(h.time) >= now);

// After (correct)
let closestIndex = 0;
let closestDiff = Infinity;
hourlyData.forEach((h, i) => {
  const diff = Math.abs(new Date(h.time).getTime() - now.getTime());
  if (diff < closestDiff) {
    closestDiff = diff;
    closestIndex = i;
  }
});
```

### 2. Wind Speed Unit

Pass unit parameter through to formatting function:

```typescript
// formatWeatherText now accepts unit
formatWeatherText(data, unit?: "celsius" | "fahrenheit")
```

### 3. Injectable Logger

Created `src/utils/logger.ts` with injectable interface:

```typescript
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
```

Used in `WeatherClient` for air quality error logging.

### 4. Frontend Error Handling

Clear weather data on error:

```typescript
} catch (error) {
  setError(error instanceof Error ? error.message : "Failed to fetch weather");
  setWeatherData(null); // Clear stale data
}
```

### 5. Rate Limiter Fix

Increment counter after successful response:

```typescript
// Before
rateLimiter.increment();
return result;

// After
return result;
// Counter incremented after successful return
```

### 6. AQI Data Quality

Return undefined instead of coercing nullish values:

```typescript
// Before
us_aqi: data.current.us_aqi ?? 0,

// After  
us_aqi: data.current.us_aqi ?? undefined,
```

## Consequences

### Positive

- Correct hourly forecast display
- Wind speed respects user preference
- Air quality errors now logged for debugging
- Users don't see stale data on errors
- Rate limiting accurately counts successful requests
- AQI shows "Unavailable" instead of misleading 0

### Negative

- None identified

## References

- Open-Meteo API Documentation
- ADR-002: Layered Architecture (for injectable logger)

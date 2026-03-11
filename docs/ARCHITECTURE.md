# Architecture

## Overview

The Weather MCP App is a Model Context Protocol server with an interactive React UI. It provides weather data by integrating with the Open-Meteo API.

## Design Principles

1. **Type Safety** - All API responses validated with Zod v3 schemas
2. **Error Handling** - Custom error classes with proper HTTP status codes
3. **Rate Limiting** - Process-global rate limiting to prevent API abuse
4. **Separation of Concerns** - Clean layered architecture
5. **Security** - Helmet.js for headers, input validation, request limits
6. **Testability** - Injectable logger for mocking in tests

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│              MCP Server                      │
│           (server.ts - ~80 lines)           │
├─────────────────────────────────────────────┤
│              Handler Layer                   │
│         (weather-handler.ts)                │
│  • Rate limiting check                       │
│  • Input validation                          │
│  • Coordinates resolution                    │
│  • Response formatting                       │
├─────────────────────────────────────────────┤
│              Service Layer                   │
│       (weather-formatter.ts)                 │
│  • Weather text formatting                   │
│  • Wind direction conversion                │
│  • AQI level mapping                         │
├─────────────────────────────────────────────┤
│              API Layer                       │
│       (weather-client.ts)                    │
│  • Open-Meteo weather API                    │
│  • Geocoding API                             │
│  • Air quality API                           │
│  • Injectable logger                         │
└─────────────────────────────────────────────┘
```

## Key Components

### Server (server.ts)

Creates MCP server with:
- `get_weather` tool for weather queries
- `ui://weather/mcp-app.html` resource for React UI

### Handler (weather-handler.ts)

- Validates input using Zod schema
- Checks rate limits before processing
- Fetches geocoding, weather, and air quality data
- Formats response as text and structured data

### Client (weather-client.ts)

- `fetchGeocoding()` - Resolves location to coordinates
- `fetchWeatherData()` - Gets current + hourly + daily weather
- `fetchAirQualityData()` - Gets air quality (optional)
- All responses validated with Zod schemas
- Uses injectable logger for error tracking

### Formatter (weather-formatter.ts)

- `formatWeatherText()` - Human-readable weather summary
- `getWindDirection()` - Degrees to compass direction
- `getAQILevel()` - AQI number to level string

## Frontend Architecture

### React with shadcn/ui

```
src/
├── App.tsx                  # Main component with shadcn
├── components/ui/           # shadcn components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── toggle.tsx
│   └── toggle-group.tsx
└── lib/
    └── utils.ts             # cn() utility
```

### State Management

- React useState for weather data and UI state
- Error state with clear on new requests
- Unit preference persisted in state

## Security Architecture

### Request Validation

```
User Input → Zod Schema Validation → Handler → API
                 ↓
            Error Response
```

### Headers

| Header | Development | Production |
|--------|-------------|------------|
| CORS | localhost:3000,3001,5173 | ALLOWED_ORIGINS env |
| HSTS | disabled | maxAge: 1yr |
| X-Content-Type-Options | - | nosniff |
| X-Frame-Options | - | DENY |

### Rate Limiting

- **Hourly**: 100 requests
- **Daily**: 1,000 requests
- **Monthly**: 30,000 requests

Implemented as process-global singleton (limitations noted).

## Data Flow

```
1. User calls get_weather tool
         ↓
2. Handler validates input schema
         ↓
3. Rate limiter check (reject if exceeded)
         ↓
4. fetchGeocoding(location) → {lat, lon, name, country}
         ↓
5. fetchWeatherData(lat, lon, unit) → WeatherData
         ↓
6. fetchAirQualityData(lat, lon) → AirQuality? (optional)
         ↓
7. formatWeatherText(data, unit) → text response
         ↓
8. Increment rate limit counter (after success)
         ↓
9. Return { content: [{text}], structuredContent: {data} }
```

## Configuration (config.ts)

Centralized configuration using `as const` for type safety:

```typescript
{
  app: { name, version },
  api: { openMeteo: { baseUrl, geocodingUrl, airQualityUrl } },
  rateLimit: { hourly, daily, monthly, windowMs },
  cache: { weatherTtlMinutes, geocodingTtlMinutes }
}
```

## Error Handling

### Custom Errors (src/errors/index.ts)

- `AppError` - Base error class
- Specific error types for different failure modes

### Logger (src/utils/logger.ts)

- Injectable `Logger` interface
- Default: Pino logger
- Mockable for testing

### Error Response Format

```json
{
  "content": [{ "type": "text", "text": "Error: <message>" }],
  "isError": true
}
```

## Testing Strategy

- **Unit Tests** - 56 tests covering core logic
  - Schema validation
  - Handler functions
  - Rate limiting
  - Configuration

- **E2E Tests** - Skipped (Zod v3/v4 SDK compatibility issue)

## Bug Fixes

| Issue | Fix |
|-------|-----|
| Hourly index calculation | Find closest timestamp, not first past |
| Wind speed unit mismatch | Pass unit to formatWeatherText |
| AQI silent failures | Added injectable logger for tracking |
| Frontend stale weather | Clear weatherData on error |
| Rate limiter increment | Moved to after successful response |
| AQI data quality | Return undefined instead of coerce nullish to 0 |

## Dependencies

### Production

| Package | Purpose |
|---------|---------|
| @modelcontextprotocol/sdk | MCP server implementation |
| @modelcontextprotocol/ext-apps | React UI integration |
| express | HTTP server |
| helmet | Security headers |
| pino | Structured logging |
| zod | Input validation (v3) |
| lucide-react | Icon library |
| class-variance-authority | Component variants |
| clsx + tailwind-merge | CSS utilities |

### Development

| Package | Purpose |
|---------|---------|
| jest | Testing framework |
| ts-jest | TypeScript test support |
| typescript | Type checking |
| @types/node | Node.js types |
| typedoc | API documentation |

## Performance Considerations

- **Timeout**: 10 second timeout on API requests
- **Body Limit**: 10KB max request size
- **No caching**: Fresh data on each request (future enhancement)
- **Process-global rate limiting**: Single limiter for all clients

## Future Enhancements

- Per-client rate limiting
- Typed errors end-to-end
- Frontend component tests
- Per-hour/per-day rate limit reset windows

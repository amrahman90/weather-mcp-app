# Weather MCP App

A Model Context Protocol (MCP) server with an interactive React UI for fetching weather data. Supports city names and zip codes worldwide.

## Features

- **Current Weather**: Real-time temperature, feels-like, humidity, wind speed/direction
- **Hourly Forecast**: 24-hour forecast with weather icons
- **7-Day Forecast**: Daily high/low temperatures and conditions
- **Air Quality**: US AQI, PM2.5, PM10, and ozone levels
- **Unit Toggle**: Switch between Celsius and Fahrenheit
- **Rate Limiting**: 100/hour, 1000/day, 30000/month requests
- **shadcn/ui**: Modern, accessible React components

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (stdio)
npm run start:stdio

# Run with HTTP server
npm run start
```

## Setup Guides

- [Claude Desktop Setup](SETUP.md#claude-desktop-setup)
- [ChatGPT Setup](SETUP.md#chatgpt-setup)

## MCP Server

The server exposes a `get_weather` tool that accepts:

```typescript
{
  location: string;  // City name or zip code (required, max 200 chars)
  unit: "celsius" | "fahrenheit";  // Temperature unit (optional, default: "celsius")
}
```

### Example Request

```json
{
  "name": "get_weather",
  "arguments": {
    "location": "London",
    "unit": "celsius"
  }
}
```

### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Weather in London:\nMainly clear, 15°C\nFeels like 13°C\nHumidity: 72%\nWind: WNW 12 km/h\nAir Quality: Moderate (AQI: 65)\n\n7-Day Forecast:\nMon: 12° - 18°, Mainly clear\nTue: 11° - 17°, Partly cloudy\n..."
    }
  ],
  "structuredContent": {
    "current": { ... },
    "hourly": [ ... ],
    "daily": [ ... ],
    "location": { ... },
    "airQuality": { ... }
  }
}
```

## Architecture

```
src/
├── api/
│   └── weather-client.ts     # Open-Meteo API integration (injectable logger)
├── constants/
│   └── weather.ts            # Shared weather codes and utilities
├── handlers/
│   └── weather-handler.ts    # Tool handler with rate limiting
├── services/
│   └── weather-formatter.ts  # Text formatting utilities
├── types/
│   └── weather.ts            # Zod schemas and TypeScript types
├── errors/
│   └── index.ts              # Custom error classes
├── utils/
│   └── logger.ts             # Injectable logger interface
├── components/ui/            # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── toggle.tsx
│   └── toggle-group.tsx
├── lib/
│   └── utils.ts              # shadcn cn() utility
├── App.tsx                   # React UI with shadcn components
├── server.ts                 # MCP server creation
├── main.ts                   # HTTP/stdio server entry point
├── config.ts                 # Application configuration
└── rate-limiter.ts           # Rate limiting implementation
```

## UI Components

The frontend uses **shadcn/ui** for modern, accessible components:

| Component | Usage |
|-----------|-------|
| Card | Weather data display containers |
| Button | Submit/search actions |
| Input | Location search field |
| Alert | Error messages |
| Badge | AQI level indicators |
| Toggle | Unit selection (Celsius/Fahrenheit) |
| Lucide React | Icon library (Sun, Cloud, Wind, etc.) |

### Initializing shadcn

```bash
# Add new components
npx shadcn@latest add button input card

# Initialize with defaults
npx shadcn@latest init --yes --defaults
```

## Development

```bash
# Run type checking
npm run typecheck

# Run tests
npm run test

# Run unit tests only
npm run test:unit

# Run E2E tests
npm run test:e2e

# Generate API documentation
npm run docs:generate
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `ALLOWED_ORIGINS` | CORS origins (production) | - |
| `WEATHER_API_URL` | Open-Meteo API base URL | `https://api.open-meteo.com` |
| `GEOCODING_API_URL` | Geocoding API URL | `https://geocoding-api.open-meteo.com/v1` |
| `AIR_QUALITY_API_URL` | Air Quality API URL | `https://air-quality-api.open-meteo.com/v1` |

## Security

- HSTS headers enabled in production
- CORS restricted to localhost in development
- Request body limit: 10KB
- Input validation with Zod schemas
- Rate limiting on all requests
- Structured logging with Pino

## Bug Fixes History

1. **Hourly Index Calculation**: Fixed to find closest timestamp instead of first past current time
2. **Wind Speed Unit**: Fixed to respect unit parameter in formatWeatherText
3. **AQI Silent Failures**: Added logging with injectable logger for air quality errors
4. **Frontend Error Handling**: Clear weatherData on error to prevent stale displays
5. **Rate Limiter**: Fixed counter increment to occur after successful response
6. **AQI Data Quality**: Return undefined instead of coercing nullish values to 0

## License

MIT

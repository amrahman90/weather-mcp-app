# Weather MCP App

<p align="center">
  <img src="https://img.shields.io/badge/Version-0.0.1-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5.9+-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React">
</p>

A Model Context Protocol (MCP) server with an interactive React UI for fetching weather data. Works with Claude Desktop, ChatGPT, and any MCP-compatible client.

## Features

- **Current Weather** - Real-time temperature, feels-like, humidity, wind speed/direction
- **Hourly Forecast** - 24-hour forecast with weather icons
- **7-Day Forecast** - Daily high/low temperatures and conditions
- **Air Quality** - US AQI, PM2.5, PM10, and ozone levels
- **Unit Toggle** - Switch between Celsius and Fahrenheit
- **Dual Transport** - Works with stdio (Claude Desktop) and HTTP (ChatGPT)
- **Rate Limiting** - 100/hour, 1000/day, 30000/month

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd weather-mcp-app

# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Start

### Claude Desktop (Stdio)

```bash
# Run with stdio transport
npm run start:stdio
```

### ChatGPT (HTTP)

```bash
# Run HTTP server (listens on http://localhost:3001/mcp)
npm run start

# Or in development with hot reload
npm run dev
```

## Configuration

### Claude Desktop

Add to your Claude Desktop settings (`~/Library/Application Support/Claude/settings.json`):

```json
{
  "mcpServers": {
    "weather-mcp-app": {
      "command": "npx",
      "args": ["-y", "weather-mcp-app", "--stdio"]
    }
  }
}
```

Or if running locally:

```json
{
  "mcpServers": {
    "weather-mcp-app": {
      "command": "node",
      "args": ["path/to/weather-mcp-app/dist/main.js", "--stdio"]
    }
  }
}
```

### ChatGPT

Use the HTTP endpoint: `http://localhost:3001/mcp`

## Usage

### Tool: `get_weather`

```
name: get_weather
description: Get current weather, hourly forecast, 7-day forecast, and air quality for a city name or zip code.
```

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | string | Yes | City name (e.g., "London") or zip code (e.g., "10001,US") |
| `unit` | string | No | `"celsius"` or `"fahrenheit"` (default: `"celsius"`) |

#### Example Request

```json
{
  "name": "get_weather",
  "arguments": {
    "location": "San Francisco, CA",
    "unit": "celsius"
  }
}
```

#### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Weather in San Francisco:\nMainly clear, 18°C\nFeels like 17°C\nHumidity: 65%\nWind: WNW 15 km/h\nAir Quality: Good (AQI: 35)\n\nHourly Forecast:\nNow: 18°C ☀️\n1PM: 19°C 🌤️\n...\n\n7-Day Forecast:\nToday: 15° - 20°, Mainly clear\nTue: 14° - 19°, Partly cloudy\n..."
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

## Project Structure

```
weather-mcp-app/
├── src/
│   ├── api/
│   │   └── weather-client.ts      # Open-Meteo API client
│   ├── constants/
│   │   └── weather.ts             # Weather codes & utilities
│   ├── handlers/
│   │   └── weather-handler.ts    # MCP tool handler
│   ├── services/
│   │   └── weather-formatter.ts   # Text formatting
│   ├── types/
│   │   └── weather.ts             # Zod schemas & types
│   ├── errors/
│   │   └── index.ts              # Custom errors
│   ├── utils/
│   │   └── logger.ts             # Logging utilities
│   ├── components/ui/            # shadcn/ui components
│   ├── App.tsx                   # Main React UI
│   ├── server.ts                  # MCP server setup
│   ├── main.ts                    # Entry point
│   └── config.ts                  # Configuration
├── dist/                          # Built output
│   ├── main.js                    # Compiled server
│   └── mcp-app.html              # Compiled UI
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `ALLOWED_ORIGINS` | CORS origins (production) | - |

## Development Commands

```bash
# Build the project
npm run build

# Build server only
npm run build:server

# Run with stdio transport
npm run start:stdio

# Run with HTTP server
npm run start

# Development mode with watch
npm run dev

# Type checking
npm run typecheck

# Run tests
npm run test

# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e
```

## API Reference

Uses free Open-Meteo APIs (no API key required):

- **Geocoding**: `https://geocoding-api.open-meteo.com/v1/search`
- **Weather**: `https://api.open-meteo.com/v1/forecast`
- **Air Quality**: `https://air-quality-api.open-meteo.com/v1/air-quality`

## Security

- HSTS headers enabled in production
- CORS restricted to localhost in development
- Request body limit: 10KB
- Input validation with Zod schemas
- Rate limiting on all requests
- Structured logging with Pino

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

## Acknowledgments

- **[Open-Meteo API](https://open-meteo.com/)** - Free weather and air quality data API. This project uses their Geocoding, Weather Forecast, and Air Quality APIs.
- **[MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps)** - For enabling interactive UI capabilities in MCP servers.
- **[shadcn/ui](https://ui.shadcn.com/)** - For the beautiful and accessible React components.
- **[Lucide](https://lucide.dev/)** - For the icon library.

## License

MIT

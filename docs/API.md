# API Documentation

## Table of Contents

- [MCP Server](#mcp-server)
- [Tool: get_weather](#tool-get_weather)
- [Resource: UI](#resource-ui)
- [Server Functions](#server-functions)
- [Weather Types](#weather-types)
- [Logger](#logger)

---

## MCP Server

### createServer

Creates and configures the MCP server with weather tool and UI resource.

```typescript
function createServer(): McpServer
```

**Returns**: Configured `McpServer` instance with:
- `get_weather` tool registered
- `ui://weather/mcp-app.html` resource registered

**Example**:
```typescript
import { createServer } from "./server.js";

const server = createServer();
```

---

## Tool: get_weather

Retrieves weather data for a given location.

### Input Schema

```typescript
{
  location: string;  // Required, 1-200 characters
  unit?: "celsius" | "fahrenheit";  // Optional, default: "celsius"
}
```

### Output Schema

```typescript
{
  current: {
    temperature: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: Array<{
    time: string;  // ISO 8601
    temperature_2m: number;
    weather_code: number;
    precipitation_probability: number;
  }>;
  daily: Array<{
    time: string;
    temperature_2m_max: number;
    temperature_2m_min: number;
    weather_code: number;
    precipitation_sum: number;
    sunrise: string;
    sunset: string;
  }>;
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  airQuality?: {
    us_aqi: number | undefined;
    pm2_5: number | undefined;
    pm10: number | undefined;
    ozone: number | undefined;
  };
}
```

### Error Responses

| Error | Description |
|-------|-------------|
| Rate limit exceeded | Too many requests |
| Location not found | Invalid location string |
| HTTP error | API request failed |
| Invalid response | API returned invalid data |

---

## Resource: UI

### Resource URI

```
ui://weather/mcp-app.html
```

### Description

Interactive React-based weather dashboard UI built with shadcn/ui components.

### Usage

Access via MCP client that supports resources:

```typescript
const response = await client.request(
  { method: "resources/read", params: { uri: "ui://weather/mcp-app.html" } },
  {}
);
```

---

## Server Functions

### handleGetWeather

Tool handler for `get_weather` tool.

```typescript
async function handleGetWeather(params: unknown): Promise<CallToolResult>
```

**Parameters**:
- `params` - Tool arguments (validated against schema)

**Returns**: `CallToolResult` with:
- `content[].type`: Always `"text"`
- `content[].text`: Formatted weather text
- `structuredContent`: Full weather data object

**Throws**: Never - errors returned in result

**Rate Limiting**:
- Checked before processing
- Returns error if limit exceeded
- Increments counters after successful response

---

### fetchGeocoding

Resolves location string to coordinates.

```typescript
async function fetchGeocoding(location: string): Promise<GeocodingResult>
```

**Parameters**:
- `location` - City name or zip code

**Returns**:
```typescript
{
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
```

**Throws**:
- `Error` with "Location not found: {location}" if not found

---

### fetchWeatherData

Fetches weather data from Open-Meteo API.

```typescript
async function fetchWeatherData(
  lat: number,
  lon: number,
  unit: "celsius" | "fahrenheit"
): Promise<WeatherData>
```

**Parameters**:
- `lat` - Latitude (-90 to 90)
- `lon` - Longitude (-180 to 180)
- `unit` - Temperature unit

**Returns**: `WeatherData` object (see types below)

---

### fetchAirQualityData

Fetches air quality data (optional, may return undefined).

```typescript
async function fetchAirQualityData(
  lat: number,
  lon: number
): Promise<WeatherData["airQuality"] | undefined>
```

**Note**: Air quality data is not available for all locations. Failures are logged via injectable logger but don't throw. Returns `undefined` if data unavailable instead of coercing to 0.

---

### formatWeatherText

Formats weather data as human-readable text.

```typescript
function formatWeatherText(
  data: WeatherData,
  unit?: "celsius" | "fahrenheit"
): string
```

**Parameters**:
- `data` - Weather data to format
- `unit` - Unit for wind speed display (default: "celsius")

**Returns**: Multi-line formatted string

**Example Output**:
```
Weather in London:
Mainly clear, 15°C
Feels like 13°C
Humidity: 72%
Wind: WNW 12 km/h

7-Day Forecast:
Mon: 12° - 18°, Mainly clear
```

---

### getWindDirection

Converts wind degrees to compass direction.

```typescript
function getWindDirection(degrees: number): string
```

**Parameters**:
- `degrees` - Wind direction in degrees (0-360)

**Returns**: Direction string (N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW)

---

### getAQILevel

Converts AQI number to human-readable level.

```typescript
function getAQILevel(aqi: number | undefined): string
```

**Parameters**:
- `aqi` - US AQI value (can be undefined)

**Returns**: Level string:
| AQI | Level |
|-----|-------|
| 0-50 | Good |
| 51-100 | Moderate |
| 101-150 | Unhealthy for Sensitive |
| 151-200 | Unhealthy |
| 201-300 | Very Unhealthy |
| 300+ | Hazardous |
| undefined | Unavailable |

---

## Logger

### Logger Interface

Injectable logger for testability and consistent logging.

```typescript
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
```

### createLogger

Creates a Pino-based logger.

```typescript
function createLogger(): Logger
```

### Usage in weather-client.ts

```typescript
const weatherClient = new WeatherClient(logger);

async function fetchAirQualityData(...) {
  try {
    // ... fetch logic
  } catch (error) {
    logger.error("Failed to fetch air quality", { lat, lon, error });
    return undefined;
  }
}
```

---

## Weather Types

### WeatherData

```typescript
interface WeatherData {
  current: {
    temperature: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: Array<{
    time: string;
    temperature_2m: number;
    weather_code: number;
    precipitation_probability: number;
  }>;
  daily: Array<{
    time: string;
    temperature_2m_max: number;
    temperature_2m_min: number;
    weather_code: number;
    precipitation_sum: number;
    sunrise: string;
    sunset: string;
  }>;
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  airQuality?: {
    us_aqi: number | undefined;
    pm2_5: number | undefined;
    pm10: number | undefined;
    ozone: number | undefined;
  };
}
```

### GeocodingResult

```typescript
interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
```

### GetWeatherInput

```typescript
interface GetWeatherInput {
  location: string;
  unit?: "celsius" | "fahrenheit";
}
```

---

## Bug Fixes in API

| Issue | Fix |
|-------|-----|
| Hourly index | Find closest timestamp to current time |
| Wind unit | Pass unit param to formatWeatherText |
| AQI nullish | Return undefined instead of 0 for missing values |

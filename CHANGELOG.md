# Changelog

All notable changes to this project will be documented in this file.

## [0.0.1] - 2026-03-11

### Added

- Initial project setup with React + TypeScript + Vite
- MCP server implementation with weather tool (`get_weather`)
- Interactive weather UI with search functionality
- Integration with Open-Meteo API (weather + air quality)
- Support for both stdio (Claude Desktop) and HTTP transports

### Fixed

- **API response format mismatch**: Open-Meteo API returns date strings by default, but Zod schema expected Unix timestamps. Fixed by adding `timeformat=unixtime` to API request.

- **Sunrise/sunset format**: With `timeformat=unixtime`, `sunrise`/`sunset` fields return numbers instead of strings. Fixed by updating Zod schema to accept `z.union([z.string(), z.number()])`.

- **MCP output validation error**: Error `Invalid structured content for tool get_weather: content is required` was fixed by:
  - Setting `weatherToolOutputSchema = weatherDataSchema` (matching output to actual data structure)
  - Adding `structuredContent: weather` to handler return
  - Adding `isError: true` to error responses

- **Build issue**: Vite's `emptyOutDir: true` was deleting TypeScript-compiled JS files. Fixed by setting `emptyOutDir: false`.

- **Air quality URL**: Fixed duplicate `/v1` in the URL path.

- **MCP Apps SDK Integration**: Fixed UI not updating when users search for weather
  - Added capabilities to App constructor: `{ tools: { listChanged: true } }`
  - Changed from callback-based `ontoolresult` to Promise-based `callServerTool()`
  - Result data now properly extracted from `result.structuredContent`

### Changed

- Updated `handleSearch()` to properly process Promise result from `callServerTool()`
- Updated `handleUnitChange()` similarly for unit toggle
- TypeScript strictness improvements (using `as unknown as WeatherData` for type casting)

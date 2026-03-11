# Setup Guide

This guide covers how to set up the Weather MCP App with Claude Desktop and ChatGPT.

## Prerequisites

- **Node.js** 18+ 
- **npm** or **bun**
- **Claude Desktop** (for Claude integration)
- **ChatGPT** (for OpenAI integration)

---

## Build the App

Before configuring any client, build the project:

```bash
# Install dependencies (if not done)
npm install

# Build the server and UI
npm run build
```

The built files will be in:
- Server: `dist/main.js`
- UI: `dist/mcp-app.html`

---

## Claude Desktop Setup

### Step 1: Locate Claude Desktop Config

The config file location varies by OS:

| OS | Path |
|----|------|
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

### Step 2: Edit the Config

Open the config file and add the weather-mcp-app server:

```json
{
  "preferences": {
    "coworkScheduledTasksEnabled": true,
    "ccdScheduledTasksEnabled": true,
    "sidebarMode": "chat",
    "coworkWebSearchEnabled": true
  },
  "mcpServers": {
    "weather-mcp-app": {
      "command": "node",
      "args": ["C:/Users/mahmu/IdeaProjects/weather-mcp-app/dist/main.js", "--stdio"],
      "cwd": "C:/Users/mahmu/IdeaProjects/weather-mcp-app",
      "env": {
        "WEATHER_API_URL": "https://api.open-meteo.com",
        "GEOCODING_API_URL": "https://geocoding-api.open-meteo.com/v1",
        "AIR_QUALITY_API_URL": "https://air-quality-api.open-meteo.com/v1"
      }
    }
  }
}
```

**macOS/Linux Example:**
```json
{
  "mcpServers": {
    "weather-mcp-app": {
      "command": "node",
      "args": [
        "/Users/yourusername/IdeaProjects/weather-mcp-app/dist/main.js"
      ]
    }
  }
}
```

### Step 3: Restart Claude Desktop

1. Completely quit Claude Desktop (not just close the window)
2. Reopen Claude Desktop
3. The weather tool should now be available

### Step 4: Verify

In Claude, try asking:
> "What's the weather in London?"

You should see a formatted weather response with current conditions, forecast, and air quality.

### Troubleshooting Claude

**Issue: Tool not found**
- Verify the path in config is correct
- Check Claude Desktop logs: `%APPDATA%\Claude\logs\`
- Try using absolute path with forward slashes: `C:/Users/...`

**Issue: Connection refused**
- Make sure the server builds correctly: `npm run build`
- Check if port 3001 is available

**Issue: Permission denied**
- On macOS/Linux, you may need to make the file executable:
  ```bash
  chmod +x dist/main.js
  ```

---

## ChatGPT Setup

### Option 1: MCP via OpenAI Agents SDK (Advanced)

If you're using the OpenAI Agents SDK with MCP support:

```typescript
import { Agent } from "@openai/agents";
import { MCPServer } from "@modelcontextprotocol/sdk";

const server = new MCPServer({
  command: "node",
  args: ["/path/to/weather-mcp-app/dist/main.js"],
});

await server.connect();

const agent = new Agent();
const result = await agent.run(
  "What's the weather in Tokyo?",
  { mcpServers: [server] }
);
```

### Option 2: Manual API Integration (Simpler)

If MCP isn't directly supported in your ChatGPT version, use the Open-Meteo API directly:

1. **No setup needed** - The API is free and open
2. Use in Custom GPTs or assistants:

```
You can access weather data directly using the free Open-Meteo API.
Example: https://open-meteo.com/en
For any weather queries, I'll fetch data from Open-Meteo.
```

### Option 3: Deploy as Web Service

Deploy the MCP server as an HTTP endpoint:

```bash
# Run as HTTP server (default port 3001)
npm run start
```

Then use with any HTTP-capable client:

```typescript
// Example: Call the weather API directly
const response = await fetch('http://localhost:3001/weather?location=London');
const data = await response.json();
```

---

## Available Tools

### get_weather

Get current weather, forecast, and air quality for any location.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | string | Yes | City name or zip code (max 200 chars) |
| `unit` | string | No | `"celsius"` or `"fahrenheit"` (default: celsius) |

**Example:**
```json
{
  "name": "get_weather",
  "arguments": {
    "location": "New York",
    "unit": "fahrenheit"
  }
}
```

### ui://weather/mcp-app.html

Interactive weather dashboard UI.

Access via MCP client that supports resources.

---

## Rate Limits

The server implements rate limiting:

| Window | Limit |
|--------|-------|
| Hourly | 100 requests |
| Daily | 1,000 requests |
| Monthly | 30,000 requests |

---

## Environment Variables

You can override the default API endpoints if needed:

| Variable | Description | Default |
|----------|-------------|---------|
| `WEATHER_API_URL` | Open-Meteo API base URL | `https://api.open-meteo.com` |
| `GEOCODING_API_URL` | Geocoding API URL | `https://geocoding-api.open-meteo.com/v1` |
| `AIR_QUALITY_API_URL` | Air Quality API URL | `https://air-quality-api.open-meteo.com/v1` |

Example for custom endpoints:

```json
{
  "mcpServers": {
    "weather-mcp-app": {
      "command": "node",
      "args": ["C:\\path\\to\\dist\\main.js"],
      "env": {
        "WEATHER_API_URL": "https://api.open-meteo.com",
        "GEOCODING_API_URL": "https://geocoding-api.open-meteo.com/v1",
        "AIR_QUALITY_API_URL": "https://air-quality-api.open-meteo.com/v1"
      }
    }
  }
}
```

---

## Security Notes

- Server validates all input with Zod schemas
- Request body limited to 10KB
- Production mode enables HSTS headers
- CORS restricted in production

---

## Development Mode

To run in development with auto-reload:

```bash
npm run dev
```

This runs both the Vite build watcher and the server with hot reload.

---

## Need Help?

- **Issues**: Check the logs in the terminal where the server runs
- **Configuration**: See `docs/API.md` for full API documentation
- **Architecture**: See `docs/ARCHITECTURE.md` for system design

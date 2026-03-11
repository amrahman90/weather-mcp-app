import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "../../main.ts");

describe.skip("MCP Server E2E", () => {
  let transport: StdioClientTransport;
  let client: Client;

  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: "tsx",
      args: [SERVER_PATH, "--stdio"],
      stderr: "pipe",
    });

    client = new Client(
      {
        name: "weather-mcp-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
  });

  describe("initialize", () => {
    it("should initialize the server", async () => {
      const result = await client.request(
        { method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0.0" } } },
        {}
      );

      expect(result.protocolVersion).toBeDefined();
      expect(result.serverInfo).toBeDefined();
      expect(result.serverInfo?.name).toBe("Weather MCP App");
    });
  });

  describe("tools/list", () => {
    it("should list available tools", async () => {
      const result = await client.request({ method: "tools/list", params: {} }, {});

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);
      
      const weatherTool = result.tools.find((t: { name: string }) => t.name === "get_weather");
      expect(weatherTool).toBeDefined();
      expect(weatherTool?.description).toContain("weather");
    });
  });

  describe("tools/call", () => {
    it("should return weather data for valid location", async () => {
      const result = await client.request(
        { method: "tools/call", params: { name: "get_weather", arguments: { location: "London", unit: "celsius" } } },
        {}
      );

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      
      const textContent = result.content[0];
      expect(textContent.type).toBe("text");
      expect((textContent as { text: string }).text).toContain("London");
    }, 30000);

    it("should handle invalid location", async () => {
      const result = await client.request(
        { method: "tools/call", params: { name: "get_weather", arguments: { location: "InvalidLocation123456789", unit: "celsius" } } },
        {}
      );

      expect(result.content).toBeDefined();
      expect(result.isError).toBe(true);
    }, 30000);

    it("should reject empty location", async () => {
      const result = await client.request(
        { method: "tools/call", params: { name: "get_weather", arguments: { location: "", unit: "celsius" } } },
        {}
      );

      expect(result.isError).toBe(true);
    }, 30000);

    it("should reject location exceeding max length", async () => {
      const longLocation = "a".repeat(201);
      const result = await client.request(
        { method: "tools/call", params: { name: "get_weather", arguments: { location: longLocation, unit: "celsius" } } },
        {}
      );

      expect(result.isError).toBe(true);
    }, 30000);
  });

  describe("resources/list", () => {
    it("should list available resources", async () => {
      const result = await client.request({ method: "resources/list", params: {} }, {});

      expect(result.resources).toBeDefined();
    });
  });

  describe("resources/read", () => {
    it("should read the UI resource", async () => {
      const listResult = await client.request({ method: "resources/list", params: {} }, {});
      const uiResource = listResult.resources?.find((r: { uri: string }) => r.uri === "ui://weather/mcp-app.html");

      if (uiResource) {
        const readResult = await client.request(
          { method: "resources/read", params: { uri: "ui://weather/mcp-app.html" } },
          {}
        );

        expect(readResult.contents).toBeDefined();
        expect(readResult.contents.length).toBeGreaterThan(0);
        expect(readResult.contents[0].mimeType).toBe("text/html");
      }
    }, 10000);
  });
});

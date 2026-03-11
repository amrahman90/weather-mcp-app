import { useState, useEffect } from "react";
import { App, applyHostStyleVariables, applyHostFonts, type McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { Search, Cloud, Sun, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning, MapPin, Droplets, Wind, Sunrise, Sunset, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WEATHER_CODES, getWindDirection } from "./constants/weather";

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
    us_aqi: number;
    pm2_5?: number;
    pm10?: number;
    ozone?: number;
  };
}

function getWeatherIcon(code: number) {
  if (code === 0) return { icon: Sun, label: "Clear" };
  if (code <= 3) return { icon: CloudSun, label: "Partly cloudy" };
  if (code <= 48) return { icon: CloudFog, label: "Fog" };
  if (code <= 67) return { icon: CloudRain, label: "Rain" };
  if (code <= 77) return { icon: CloudSnow, label: "Snow" };
  if (code <= 82) return { icon: CloudRain, label: "Showers" };
  if (code <= 86) return { icon: CloudSnow, label: "Snow showers" };
  return { icon: CloudLightning, label: "Thunderstorm" };
}

function getAQILevel(aqi: number): { level: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (aqi <= 50) return { level: "Good", variant: "default" };
  if (aqi <= 100) return { level: "Moderate", variant: "secondary" };
  if (aqi <= 150) return { level: "Unhealthy for Sensitive", variant: "secondary" };
  if (aqi <= 200) return { level: "Unhealthy", variant: "destructive" };
  if (aqi <= 300) return { level: "Very Unhealthy", variant: "destructive" };
  return { level: "Hazardous", variant: "destructive" };
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherApp() {
  const [app, setApp] = useState<App | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [inputLocation, setInputLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius");

  useEffect(() => {
    const appInstance = new App(
      { name: "Weather App", version: "0.0.1" },
      { tools: { listChanged: true } }
    );

    appInstance.ontoolresult = (result) => {
      console.log("[WeatherApp] ontoolresult fired:", JSON.stringify(result, null, 2));
    };

    appInstance.onerror = (err) => {
      setLoading(false);
      setError(err.message || "An error occurred");
    };

    appInstance.onhostcontextchanged = (ctx: McpUiHostContext) => {
      if (ctx.styles?.variables) {
        applyHostStyleVariables(ctx.styles.variables);
      }
      if (ctx.styles?.css?.fonts) {
        applyHostFonts(ctx.styles.css.fonts);
      }
      if (ctx.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    appInstance.connect().then(() => {
      setApp(appInstance);
      const ctx = appInstance.getHostContext();
      if (ctx?.styles?.variables) {
        applyHostStyleVariables(ctx.styles.variables);
      }
      if (ctx?.theme === "dark") {
        document.documentElement.classList.add("dark");
      }
    }).catch((err) => {
      setConnectionError(err instanceof Error ? err.message : "Failed to connect");
    });
  }, []);

  const handleSearch = async () => {
    if (!app || !inputLocation.trim()) return;
    
    setLoading(true);
    setError(null);
    setWeatherData(null);

    try {
      console.log("[WeatherApp] Calling server tool with:", { location: inputLocation, unit });
      const result = await app.callServerTool({
        name: "get_weather",
        arguments: { location: inputLocation, unit },
      });
      
      console.log("[WeatherApp] Tool result:", JSON.stringify(result, null, 2));
      
      if (result.isError) {
        const errorText = result.content?.find((c) => c.type === "text")?.text;
        setError(errorText || "An error occurred");
        setWeatherData(null);
      } else if (result.structuredContent) {
        setWeatherData(result.structuredContent as unknown as WeatherData);
        setError(null);
      } else {
        console.log("[WeatherApp] No structuredContent in result, checking content...");
        console.log("[WeatherApp] Full result keys:", Object.keys(result));
      }
    } catch (err) {
      console.error("[WeatherApp] Error calling tool:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleUnitChange = async (newUnit: string) => {
    const actualNewUnit = newUnit as "celsius" | "fahrenheit";
    setUnit(actualNewUnit);
    if (weatherData && inputLocation) {
      setLoading(true);
      setError(null);
      try {
        const result = await app?.callServerTool({
          name: "get_weather",
          arguments: { location: inputLocation, unit: actualNewUnit },
        });
        
        if (result && !result.isError && result.structuredContent) {
          setWeatherData(result.structuredContent as unknown as WeatherData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch weather");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!app) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center">
          <Cloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {connectionError ? (
            <>
              <p className="text-destructive font-semibold mb-2">Connection failed</p>
              <p className="text-sm text-muted-foreground">{connectionError}</p>
            </>
          ) : (
            <p>Connecting to weather service...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputLocation}
          onChange={(e) => setInputLocation(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter city name or zip code"
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Unit Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={unit === "celsius" ? "default" : "outline"}
          size="sm"
          onClick={() => handleUnitChange("celsius")}
        >
          °C
        </Button>
        <Button
          variant={unit === "fahrenheit" ? "default" : "outline"}
          size="sm"
          onClick={() => handleUnitChange("fahrenheit")}
        >
          °F
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Data State */}
      {!weatherData && !error && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Cloud className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">Search for a city to see the weather</p>
          <p className="text-sm mt-2">Supports city names and zip codes</p>
        </div>
      )}

      {/* Weather Data Display */}
      {weatherData && (
        <div className="space-y-4">
          {/* Current Weather */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <CardTitle>
                    {weatherData.location.name}
                    {weatherData.location.country && `, ${weatherData.location.country}`}
                  </CardTitle>
                </div>
                {(() => {
                  const { icon: WeatherIcon } = getWeatherIcon(weatherData.current.weather_code);
                  return <WeatherIcon className="w-12 h-12" />;
                })()}
              </div>
              <p className="text-muted-foreground">{WEATHER_CODES[weatherData.current.weather_code] || "Unknown"}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">
                  {Math.round(weatherData.current.temperature)}°
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Thermometer className="w-4 h-4" />
                  Feels like {Math.round(weatherData.current.apparent_temperature)}°
                </span>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Droplets className="w-4 h-4" />
                  Humidity: {weatherData.current.relative_humidity_2m}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-4 h-4" />
                  {getWindDirection(weatherData.current.wind_direction_10m)} {Math.round(weatherData.current.wind_speed_10m)} {unit === "celsius" ? "km/h" : "mph"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hourly Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {weatherData.hourly.slice(0, 24).map((hour, i) => {
                  const { icon: HourIcon } = getWeatherIcon(hour.weather_code);
                  return (
                    <div key={i} className="flex flex-col items-center min-w-[60px] p-2 rounded-lg bg-secondary/50">
                      <span className="text-xs text-muted-foreground">
                        {i === 0 ? "Now" : formatTime(hour.time).replace(/AM|PM/, "")}
                      </span>
                      <HourIcon className="w-5 h-5 my-1" />
                      <span className="font-medium">{Math.round(hour.temperature_2m)}°</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weatherData.daily.map((day, i) => {
                  const { icon: DayIcon } = getWeatherIcon(day.weather_code);
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                      <span className="font-medium w-12">
                        {i === 0 ? "Today" : formatDay(day.time)}
                      </span>
                      <DayIcon className="w-5 h-5" />
                      <div className="flex items-center gap-2 min-w-[80px] justify-end">
                        <span className="text-muted-foreground">{Math.round(day.temperature_2m_min)}°</span>
                        <span className="font-semibold">{Math.round(day.temperature_2m_max)}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Air Quality & Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Air Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Air Quality</CardTitle>
              </CardHeader>
              <CardContent>
                {weatherData.airQuality ? (
                  <div className="space-y-2">
                    <Badge variant={getAQILevel(weatherData.airQuality.us_aqi).variant}>
                      {weatherData.airQuality.us_aqi} - {getAQILevel(weatherData.airQuality.us_aqi).level}
                    </Badge>
                    <div className="text-sm space-y-1">
                      {weatherData.airQuality.pm2_5 !== undefined && (
                        <p>PM2.5: {weatherData.airQuality.pm2_5}</p>
                      )}
                      {weatherData.airQuality.pm10 !== undefined && (
                        <p>PM10: {weatherData.airQuality.pm10}</p>
                      )}
                      {weatherData.airQuality.ozone !== undefined && (
                        <p>Ozone: {weatherData.airQuality.ozone}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not available for this location</p>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Sunrise className="w-4 h-4" />
                    Sunrise: {formatTime(weatherData.daily[0]?.sunrise || "")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Sunset className="w-4 h-4" />
                    Sunset: {formatTime(weatherData.daily[0]?.sunset || "")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Precipitation: {weatherData.current.precipitation} mm
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

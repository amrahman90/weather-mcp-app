import type { WeatherData } from "../types/weather.js";
import { WEATHER_CODES, getWindDirection } from "../constants/weather.js";

export { WEATHER_CODES, getWindDirection };

export function formatWeatherText(data: WeatherData, unit: "celsius" | "fahrenheit" = "celsius"): string {
  const current = data.current;
  const location = data.location;
  const code = current.weather_code;
  const description = WEATHER_CODES[code] || "Unknown";
  
  const windDir = getWindDirection(current.wind_direction_10m);
  const windUnit = unit === "celsius" ? "km/h" : "mph";
  
  let text = `Weather in ${location.name}:\n`;
  text += `${description}, ${Math.round(current.temperature)}°\n`;
  text += `Feels like ${Math.round(current.apparent_temperature)}°\n`;
  text += `Humidity: ${current.relative_humidity_2m}%\n`;
  text += `Wind: ${windDir} ${Math.round(current.wind_speed_10m)} ${windUnit}\n`;
  
  if (data.airQuality && data.airQuality.us_aqi != null) {
    const aqiLevel = getAQILevel(data.airQuality.us_aqi);
    text += `Air Quality: ${aqiLevel} (AQI: ${data.airQuality.us_aqi})\n`;
  }
  
  text += `\n7-Day Forecast:\n`;
  data.daily.slice(0, 7).forEach((day) => {
    const date = new Date(day.time);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayDesc = WEATHER_CODES[day.weather_code] || "Unknown";
    text += `${dayName}: ${Math.round(day.temperature_2m_min)}° - ${Math.round(day.temperature_2m_max)}°, ${dayDesc}\n`;
  });
  
  return text;
}

export function getAQILevel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

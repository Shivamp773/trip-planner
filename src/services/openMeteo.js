// Open-Meteo: free geocoding + weather APIs that need no API key (https://open-meteo.com).

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

async function getJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status})`);
  return response.json();
}

/** City/place suggestions for a search string. Only the part before the first comma is searched. */
export async function searchPlaces(query, { signal, count = 6 } = {}) {
  const name = String(query).split(',')[0].trim();
  if (name.length < 2) return [];

  const params = new URLSearchParams({ name, count: String(count), language: 'en', format: 'json' });
  const data = await getJson(`${GEOCODING_URL}?${params}`, signal);

  const seen = new Set();
  return (data.results ?? [])
    .map((place) => ({
      id: place.id,
      label: [place.name, place.admin1 !== place.name ? place.admin1 : null, place.country]
        .filter(Boolean)
        .join(', '),
      lat: place.latitude,
      lng: place.longitude,
    }))
    .filter((place) => {
      // Several villages can share a name and region; keep the first (most populous) one.
      if (seen.has(place.label)) return false;
      seen.add(place.label);
      return true;
    });
}

/** Best-effort coordinates for a free-text destination such as "Jaipur, Rajasthan, India". */
export async function geocode(query, { signal } = {}) {
  const [first] = await searchPlaces(query, { signal, count: 1 });
  return first ? { lat: first.lat, lng: first.lng } : null;
}

/** Up to 16 days of daily forecast, in the destination's local timezone. */
export async function getDailyForecast({ lat, lng }, { signal } = {}) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '16',
  });
  const { daily } = await getJson(`${FORECAST_URL}?${params}`, signal);
  if (!daily?.time) return [];

  return daily.time.map((date, i) => ({
    date,
    code: daily.weather_code?.[i],
    max: daily.temperature_2m_max?.[i],
    min: daily.temperature_2m_min?.[i],
    rainChance: daily.precipitation_probability_max?.[i] ?? null,
  }));
}

// WMO weather interpretation codes -> [emoji, label]
const WEATHER_CODES = [
  [[0], '☀️', 'Clear sky'],
  [[1], '🌤️', 'Mainly clear'],
  [[2], '⛅', 'Partly cloudy'],
  [[3], '☁️', 'Overcast'],
  [[45, 48], '🌫️', 'Fog'],
  [[51, 53, 55], '🌦️', 'Drizzle'],
  [[56, 57], '🌧️', 'Freezing drizzle'],
  [[61, 63, 65], '🌧️', 'Rain'],
  [[66, 67], '🌧️', 'Freezing rain'],
  [[71, 73, 75, 77], '🌨️', 'Snow'],
  [[80, 81, 82], '🌦️', 'Rain showers'],
  [[85, 86], '🌨️', 'Snow showers'],
  [[95], '⛈️', 'Thunderstorm'],
  [[96, 99], '⛈️', 'Thunderstorm with hail'],
];

export function describeWeather(code) {
  const match = WEATHER_CODES.find(([codes]) => codes.includes(code));
  return match ? [match[1], match[2]] : ['🌡️', 'Unknown'];
}

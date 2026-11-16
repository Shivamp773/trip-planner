import { useEffect, useState } from 'react';
import { CloudSun } from 'lucide-react';
import { addDays, formatDate, isISODate, toLatLng } from '@/lib/trip';
import { cn } from '@/lib/utils';
import { describeWeather, geocode, getDailyForecast } from '@/services/openMeteo';

const UNITS = ['C', 'F'];

export default function Weather({ trip, plan }) {
  const selection = trip.userSelection ?? {};
  const destination = plan.destination || selection.destination || '';
  const startDate = isISODate(selection.startDate) ? selection.startDate : '';
  const tripDays = Number(selection.days) || plan.itinerary.length || 1;

  // Prefer coordinates we already have (picked suggestion, then the AI's place/hotel pins) over a lookup.
  const knownCoords =
    toLatLng(selection.destinationCoords) ??
    plan.itinerary.flatMap((day) => day.places).find((place) => place.coords)?.coords ??
    plan.hotels.find((hotel) => hotel.coords)?.coords ??
    null;
  const lat = knownCoords?.lat;
  const lng = knownCoords?.lng;

  const [unit, setUnit] = useState('C');
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState({ status: 'loading' });

    (async () => {
      try {
        const coords = lat !== undefined ? { lat, lng } : await geocode(destination, { signal });
        if (!coords) {
          setState({ status: 'unavailable' });
          return;
        }

        const forecast = await getDailyForecast(coords, { signal });
        if (forecast.length === 0) {
          setState({ status: 'unavailable' });
          return;
        }

        const tripDates = new Set(startDate ? Array.from({ length: tripDays }, (_, i) => addDays(startDate, i)) : []);
        const tripForecast = forecast.filter((day) => tripDates.has(day.date));
        if (tripForecast.length > 0) {
          setState({ status: 'ready', mode: 'trip', days: tripForecast, partial: tripForecast.length < tripDays });
        } else {
          const lastForecastDate = forecast[forecast.length - 1].date;
          setState({
            status: 'ready',
            mode: 'outlook',
            days: forecast.slice(0, 7),
            tooFarAhead: Boolean(startDate) && startDate > lastForecastDate,
          });
        }
      } catch (error) {
        if (!signal.aborted) {
          console.warn('Weather unavailable', error);
          setState({ status: 'error' });
        }
      }
    })();

    return () => controller.abort();
  }, [lat, lng, destination, startDate, tripDays]);

  if (state.status === 'unavailable') return null;

  const temperature = (celsius) => {
    if (typeof celsius !== 'number') return '–';
    return Math.round(unit === 'F' ? (celsius * 9) / 5 + 32 : celsius);
  };

  let subtitle = `Checking the forecast for ${destination}…`;
  if (state.status === 'error') subtitle = 'The forecast is unavailable right now.';
  if (state.mode === 'trip') {
    subtitle = `Forecast for your trip dates${state.partial ? " (later days aren't forecast yet)" : ''}`;
  }
  if (state.mode === 'outlook') {
    subtitle = `Next 7 days in ${destination}${
      state.tooFarAhead ? '. Your trip dates will appear here closer to departure.' : ''
    }`;
  }

  return (
    <section className="mt-8 break-inside-avoid rounded-xl border bg-gradient-to-br from-sky-50 to-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <CloudSun className="h-5 w-5 text-sky-500" aria-hidden="true" /> Weather
          </h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div role="group" aria-label="Temperature unit" className="inline-flex rounded-full border bg-white p-0.5 text-sm print:hidden">
          {UNITS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={unit === option}
              onClick={() => setUnit(option)}
              className={cn('rounded-full px-3 py-1 transition', unit === option ? 'bg-gray-900 text-white' : 'text-gray-600')}
            >
              °{option}
            </button>
          ))}
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="mt-4 flex gap-3 overflow-hidden" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((key) => (
            <div key={key} className="h-28 min-w-[96px] flex-1 animate-pulse rounded-lg bg-sky-100/70" />
          ))}
        </div>
      )}

      {state.status === 'ready' && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {state.days.map((day) => {
            const [emoji, label] = describeWeather(day.code);
            return (
              <li key={day.date} className="min-w-[96px] max-w-[180px] flex-1 rounded-lg border bg-white p-3 text-center">
                <p className="text-xs font-medium text-gray-500">{formatDate(day.date)}</p>
                <p className="my-1 text-3xl" role="img" aria-label={label} title={label}>
                  {emoji}
                </p>
                <p className="text-sm font-semibold">
                  {temperature(day.max)}° <span className="font-normal text-gray-400">{temperature(day.min)}°</span>
                </p>
                {typeof day.rainChance === 'number' && (
                  <p className="mt-1 text-xs text-sky-600">💧 {day.rainChance}%</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-gray-400">
        Weather data by{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">
          Open-Meteo.com
        </a>
      </p>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon } from 'lucide-react';
import { dayColor, mapsSearchUrl } from '@/lib/trip';
import { cn } from '@/lib/utils';

const HOTEL_COLOR = '#111827';
// AI-provided coordinates are occasionally wildly wrong (e.g. a same-named town in another
// country). Points this far from the median of all points are left off the map.
const MAX_DISTANCE_KM = 1000;

function distanceKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function median(values) {
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Numbered pin; the label and colour come from our own code, never from trip data.
function pinIcon(label, color) {
  return L.divIcon({
    className: '',
    html: `<span class="trip-marker" style="background:${color}">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// Popup built from DOM nodes with textContent, so AI/user text can't inject HTML.
function popupContent({ title, subtitle, address, href }) {
  const root = document.createElement('div');
  root.className = 'trip-popup';
  const add = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    root.append(node);
    return node;
  };
  add('strong', 'trip-popup-title', title);
  if (subtitle) add('span', 'trip-popup-meta', subtitle);
  if (address) add('span', 'trip-popup-meta', address);
  const link = add('a', 'trip-popup-link', 'Open in Google Maps ↗');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return root;
}

export default function TripMap({ plan }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'hotels' | day number

  const { hotels, days } = useMemo(() => {
    const hotelPoints = plan.hotels.filter((hotel) => hotel.coords);
    const dayPoints = plan.itinerary
      .map((day) => ({
        day: day.day,
        // `order` matches the numbering in the itinerary list, even if a stop has no coordinates.
        stops: day.places.map((place, index) => ({ ...place, order: index + 1 })).filter((place) => place.coords),
      }))
      .filter((day) => day.stops.length > 0);

    const all = [...hotelPoints, ...dayPoints.flatMap((day) => day.stops)].map((point) => point.coords);
    if (all.length < 3) return { hotels: hotelPoints, days: dayPoints };

    const center = { lat: median(all.map((c) => c.lat)), lng: median(all.map((c) => c.lng)) };
    const isNear = (point) => distanceKm(center, point.coords) <= MAX_DISTANCE_KM;
    return {
      hotels: hotelPoints.filter(isNear),
      days: dayPoints
        .map((day) => ({ ...day, stops: day.stops.filter(isNear) }))
        .filter((day) => day.stops.length > 0),
    };
  }, [plan]);

  const hasPoints = hotels.length > 0 || days.length > 0;

  // Create the map once.
  useEffect(() => {
    if (!hasPoints || !containerRef.current) return undefined;
    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    // Don't hijack page scrolling: enable wheel-zoom only once the user interacts with the map.
    map.once('focus', () => map.scrollWheelZoom.enable());
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [hasPoints]);

  // Redraw pins and routes whenever the data or the filter changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const bounds = [];

    if (filter === 'all' || filter === 'hotels') {
      hotels.forEach((hotel) => {
        const position = [hotel.coords.lat, hotel.coords.lng];
        L.marker(position, { icon: pinIcon('H', HOTEL_COLOR), title: hotel.name, riseOnHover: true })
          .bindPopup(
            popupContent({
              title: hotel.name,
              subtitle: ['Hotel', hotel.price].filter(Boolean).join(' · '),
              address: hotel.address,
              href: mapsSearchUrl(hotel.name, hotel.address),
            }),
          )
          .addTo(layer);
        bounds.push(position);
      });
    }

    days
      .filter((day) => filter === 'all' || filter === day.day)
      .forEach((day) => {
        const color = dayColor(day.day);
        const route = day.stops.map((stop) => [stop.coords.lat, stop.coords.lng]);
        if (route.length > 1) {
          L.polyline(route, { color, weight: 3, opacity: 0.75, dashArray: '6 8' }).addTo(layer);
        }
        day.stops.forEach((stop, index) => {
          L.marker(route[index], { icon: pinIcon(stop.order, color), title: stop.name, riseOnHover: true })
            .bindPopup(
              popupContent({
                title: stop.name,
                subtitle: [`Day ${day.day} · Stop ${stop.order}`, stop.bestTimeToVisit].filter(Boolean).join(' · '),
                address: stop.address,
                href: mapsSearchUrl(stop.name, stop.address || plan.destination),
              }),
            )
            .addTo(layer);
        });
        bounds.push(...route);
      });

    if (bounds.length === 1) map.setView(bounds[0], 13);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [filter, hotels, days, hasPoints, plan.destination]);

  if (!hasPoints) return null;

  const filters = [
    { key: 'all', label: 'All' },
    ...(hotels.length > 0 ? [{ key: 'hotels', label: 'Hotels', color: HOTEL_COLOR }] : []),
    ...days.map((day) => ({ key: day.day, label: `Day ${day.day}`, color: dayColor(day.day) })),
  ];

  return (
    <section className="py-8 print:hidden">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800 md:text-3xl">
        <MapIcon className="h-6 w-6 text-[#f56551]" aria-hidden="true" /> Trip map
      </h2>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter the map">
        {filters.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={filter === option.key}
            onClick={() => setFilter(option.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition',
              filter === option.key ? 'border-gray-900 bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50',
            )}
          >
            {option.color && (
              <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white" style={{ background: option.color }} />
            )}
            {option.label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        className="isolate h-[320px] w-full overflow-hidden rounded-xl border sm:h-[420px]"
        role="region"
        aria-label="Map of the hotels and places in this trip"
      />
      <p className="mt-2 text-xs text-gray-500">
        Click the map to enable scroll-zoom. Pins use AI-provided coordinates and may be approximate.
      </p>
    </section>
  );
}

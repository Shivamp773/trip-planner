// Helpers for trip plans: normalising AI/Firestore data, dates, links and calendar export.

const NOT_AVAILABLE = /^(?:n\/?a|none|null|not applicable|not available)\b|^-+$/i;

const asObject = (value) => (value && typeof value === 'object' ? value : {});

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  return value && typeof value === 'object' ? [value] : [];
};

function asText(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    return NOT_AVAILABLE.test(text) ? '' : text;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return NaN;
  return typeof value === 'number' ? value : Number.parseFloat(String(value));
}

function toRating(value) {
  const rating = toNumber(value);
  return Number.isFinite(rating) && rating > 0 ? Math.min(5, Math.round(rating * 10) / 10) : null;
}

/** Accepts {latitude, longitude}, {lat, lng}, [lat, lng] or "lat, lng" and returns {lat, lng} or null. */
export function toLatLng(geo) {
  let lat;
  let lng;
  if (typeof geo === 'string') {
    const match = geo.match(/(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    lat = Number(match[1]);
    lng = Number(match[2]);
  } else if (Array.isArray(geo)) {
    [lat, lng] = geo.map(toNumber);
  } else if (geo && typeof geo === 'object') {
    lat = toNumber(geo.latitude ?? geo.lat);
    lng = toNumber(geo.longitude ?? geo.lng ?? geo.lon);
  }
  const valid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0);
  return valid ? { lat, lng } : null;
}

function normalizeTrain(value) {
  const train = asObject(value);
  return {
    name: asText(train.name ?? train.trainName),
    number: asText(train.number ?? train.trainNumber),
    departureTime: asText(train.departureTime ?? train.departure),
    arrivalTime: asText(train.arrivalTime ?? train.arrival),
    duration: asText(train.duration ?? train.timeToTravel),
    price: asText(train.price ?? train.fare),
  };
}

function normalizeFlight(value) {
  const flight = asObject(value);
  return {
    airline: asText(flight.airline),
    flightNumber: asText(flight.flightNumber ?? flight.number),
    departureTime: asText(flight.departureTime ?? flight.departure),
    arrivalTime: asText(flight.arrivalTime ?? flight.arrival),
    duration: asText(flight.duration),
    price: asText(flight.price ?? flight.fare),
  };
}

function normalizeHotel(value) {
  const hotel = asObject(value);
  return {
    name: asText(hotel.name ?? hotel.hotelName),
    address: asText(hotel.address ?? hotel.hotelAddress),
    price: asText(hotel.price ?? hotel.pricePerNight),
    rating: toRating(hotel.rating),
    description: asText(hotel.description),
    coords: toLatLng(hotel.geoCoordinates ?? hotel.coordinates),
  };
}

function normalizePlace(value) {
  const place = asObject(value);
  return {
    name: asText(place.name ?? place.placeName),
    address: asText(place.address ?? place.placeAddress),
    details: asText(place.details ?? place.placeDetails ?? place.description),
    coords: toLatLng(place.geoCoordinates ?? place.coordinates),
    ticketPricing: asText(place.ticketPricing),
    rating: toRating(place.rating),
    bestTimeToVisit: asText(place.bestTimeToVisit ?? place.timeToVisit),
    travelTime: asText(place.timeToTravelFromPreviousLocation ?? place.timeToTravel),
  };
}

function normalizeItinerary(value) {
  const days = Array.isArray(value) ? value : Object.values(asObject(value));
  return days
    .map((rawDay, index) => {
      const day = asObject(rawDay);
      const dayNumber = Number.parseInt(String(day.day ?? '').match(/\d+/)?.[0] ?? '', 10);
      return {
        day: dayNumber > 0 ? dayNumber : index + 1,
        theme: asText(day.theme ?? day.title),
        places: asArray(day.places ?? day.plan ?? day.activities)
          .map(normalizePlace)
          .filter((place) => place.name),
      };
    })
    .filter((day) => day.places.length > 0);
}

/**
 * Converts the stored `tripData` (current schema or older prompt formats) into one predictable shape,
 * so the UI never has to guard against missing or oddly-shaped fields.
 */
export function normalizeTrip(raw) {
  const trip = asObject(raw);
  const travel = asObject(trip.travelDetails);
  return {
    source: asText(trip.source),
    destination: asText(trip.destination),
    currency: asText(trip.currency),
    distanceByRoad: asText(trip.distanceByRoad ?? trip.distancebyRoad),
    timeByRoad: asText(trip.timeToTravelByRoad ?? trip.timetotravelbyRoad),
    trains: asArray(travel.trains ?? travel.train)
      .map(normalizeTrain)
      .filter((train) => train.name || train.number),
    flights: asArray(travel.flights ?? travel.flight)
      .map(normalizeFlight)
      .filter((flight) => flight.airline || flight.flightNumber),
    hotels: asArray(trip.hotels).map(normalizeHotel).filter((hotel) => hotel.name),
    itinerary: normalizeItinerary(trip.itinerary),
  };
}

const DAY_COLORS = ['#f56551', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1'];

/** Stable colour per itinerary day, shared by the map pins and the day list. */
export const dayColor = (day) => DAY_COLORS[(Math.max(1, day) - 1) % DAY_COLORS.length];

export function mapsSearchUrl(...parts) {
  const query = parts.filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Milliseconds used to sort trips; older documents used Date.now() as their id. */
export function createdAtMs(trip) {
  const createdAt = trip?.createdAt;
  if (typeof createdAt?.toMillis === 'function') return createdAt.toMillis();
  const fromId = Number(trip?.id);
  return Number.isFinite(fromId) ? fromId : 0;
}

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'trip';

// ---------- Dates (ISO "YYYY-MM-DD" strings, calculated in UTC to avoid DST/timezone drift) ----------

const pad = (n) => String(n).padStart(2, '0');

export const isISODate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Today's date in the user's own timezone. */
export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDate(iso, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return parseISODate(iso).toLocaleDateString(undefined, { ...options, timeZone: 'UTC' });
}

// ---------- Calendar export (RFC 5545 .ics) ----------

const encoder = new TextEncoder();

const escapeICS = (text) =>
  String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 bytes must be folded with CRLF + a space. */
function foldICSLine(line) {
  if (encoder.encode(line).length <= 75) return line;
  const parts = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const charSize = encoder.encode(char).length;
    if (size + charSize > 75) {
      parts.push(current);
      current = ' ';
      size = 1;
    }
    current += char;
    size += charSize;
  }
  parts.push(current);
  return parts.join('\r\n');
}

/** Builds an .ics file with one all-day event per itinerary day. */
export function buildTripCalendar({ id, plan, startDate }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const compact = (iso) => iso.replace(/-/g, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Trip Planner//Itinerary//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(`Trip to ${plan.destination}`)}`,
  ];

  plan.itinerary.forEach((day, index) => {
    const date = addDays(startDate, index);
    const stops = day.places.map((place, i) => {
      const extras = [place.bestTimeToVisit, place.ticketPricing && `Tickets: ${place.ticketPricing}`]
        .filter(Boolean)
        .join(' · ');
      return `${i + 1}. ${place.name}${extras ? ` (${extras})` : ''}${place.address ? `\n   ${place.address}` : ''}`;
    });
    lines.push(
      'BEGIN:VEVENT',
      `UID:${id}-day-${index + 1}@ai-trip-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
      `SUMMARY:${escapeICS(`Day ${day.day}: ${day.theme || plan.destination}`)}`,
      `LOCATION:${escapeICS(plan.destination)}`,
      `DESCRIPTION:${escapeICS(stops.join('\n'))}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return `${lines.map(foldICSLine).join('\r\n')}\r\n`;
}

export function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

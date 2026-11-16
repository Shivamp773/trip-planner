import { Clock, Star, Ticket } from 'lucide-react';
import { fallbackToPlaceholder, usePlacePhoto } from '@/hooks/usePlacePhoto';
import { mapsSearchUrl } from '@/lib/trip';

export default function PlaceCard({ place, order, color, destination }) {
  const { url, loading } = usePlacePhoto([place.name, destination].filter(Boolean).join(', '));

  return (
    <a
      href={mapsSearchUrl(place.name, place.address || destination)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 rounded-xl border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-36 sm:w-36">
        {loading ? (
          <div className="h-full w-full animate-pulse bg-gray-200" />
        ) : (
          <img
            src={url}
            alt={place.name}
            loading="lazy"
            onError={fallbackToPlaceholder}
            className="h-full w-full object-cover"
          />
        )}
        {/* Same number and colour as this stop's pin on the trip map */}
        <span
          className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow"
          style={{ background: color }}
        >
          {order}
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h4 className="font-bold text-gray-900">{place.name}</h4>
        {place.details && <p className="line-clamp-3 text-sm text-gray-700">{place.details}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-gray-500">
          {place.ticketPricing && (
            <span className="flex items-center gap-1">
              <Ticket className="h-3.5 w-3.5" aria-hidden="true" /> {place.ticketPricing}
            </span>
          )}
          {place.rating !== null && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" /> {place.rating}
            </span>
          )}
          {place.travelTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {place.travelTime}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

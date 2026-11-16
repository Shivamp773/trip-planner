import { MapPin, Star, Wallet } from 'lucide-react';
import { fallbackToPlaceholder, usePlacePhoto } from '@/hooks/usePlacePhoto';
import { mapsSearchUrl } from '@/lib/trip';

export default function HotelCard({ hotel, destination }) {
  // Wikipedia rarely has a reliable photo of a specific hotel, so only GoMaps is used here.
  const { url, loading } = usePlacePhoto([hotel.name, destination].filter(Boolean).join(', '), {
    allowWikipedia: false,
  });

  return (
    <a
      href={mapsSearchUrl(hotel.name, hotel.address || destination)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full break-inside-avoid flex-col overflow-hidden rounded-xl border bg-white transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="h-44 bg-gray-100">
        {loading ? (
          <div className="h-full w-full animate-pulse bg-gray-200" />
        ) : (
          <img
            src={url}
            alt={hotel.name}
            loading="lazy"
            onError={fallbackToPlaceholder}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
          {hotel.rating !== null && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-gray-600">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              {hotel.rating}
            </span>
          )}
        </div>
        {hotel.address && (
          <p className="flex gap-1.5 text-xs text-gray-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-500" aria-hidden="true" />
            {hotel.address}
          </p>
        )}
        {hotel.description && <p className="line-clamp-2 text-sm text-gray-600">{hotel.description}</p>}
        {hotel.price && (
          <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 text-sm font-medium text-white">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            {hotel.price}
          </span>
        )}
      </div>
    </a>
  );
}

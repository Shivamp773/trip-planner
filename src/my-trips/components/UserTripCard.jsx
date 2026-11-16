import { Link } from 'react-router';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fallbackToPlaceholder, usePlacePhoto } from '@/hooks/usePlacePhoto';

export default function UserTripCard({ trip, onDelete }) {
  const selection = trip.userSelection ?? {};
  const destination = trip.tripData?.destination || selection.destination || 'Your trip';
  const days = Number(selection.days) || trip.tripData?.itinerary?.length || 0;
  const { url, loading } = usePlacePhoto(destination);

  const summary = [
    days > 0 && `${days} ${days === 1 ? 'day' : 'days'}`,
    selection.budget && `${selection.budget} budget`,
    selection.companions && `with ${selection.companions}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="group relative">
      <Link to={`/view-trip/${trip.id}`} className="block rounded-xl transition-transform hover:-translate-y-1">
        <div className="h-48 overflow-hidden rounded-xl bg-gray-100">
          {loading ? (
            <div className="h-full w-full animate-pulse bg-gray-200" />
          ) : (
            <img
              src={url}
              alt={destination}
              loading="lazy"
              onError={fallbackToPlaceholder}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <h2 className="mt-3 font-semibold text-gray-900">{destination}</h2>
        {summary && <p className="text-sm text-gray-500">{summary}</p>}
      </Link>
      <Button
        size="icon"
        variant="secondary"
        aria-label={`Delete trip to ${destination}`}
        onClick={() => onDelete(trip)}
        // Revealed on hover only for mouse users; always visible on touch screens.
        className="absolute right-2 top-2 bg-white/90 shadow hover:bg-white focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      >
        <Trash2 className="text-red-600" />
      </Button>
    </div>
  );
}

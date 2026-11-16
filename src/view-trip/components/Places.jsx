import { AlarmClock } from 'lucide-react';
import { dayColor } from '@/lib/trip';
import PlaceCard from './PlaceCard';

export default function Places({ plan }) {
  if (plan.itinerary.length === 0) return null;
  return (
    <section className="py-8">
      <h2 className="mb-2 text-2xl font-bold text-gray-800 md:text-3xl">Places to visit and plan</h2>
      <div className="space-y-8">
        {plan.itinerary.map((day, dayIndex) => {
          const color = dayColor(day.day);
          return (
            <div key={`${day.day}-${dayIndex}`}>
              <h3 className="mt-6 flex flex-wrap items-center gap-2 text-lg font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ background: color }} aria-hidden="true" />
                Day {day.day}
                {day.theme && <span className="font-normal text-gray-500">· {day.theme}</span>}
              </h3>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {day.places.map((place, index) => (
                  <div key={`${place.name}-${index}`} className="break-inside-avoid">
                    <PlaceCard place={place} order={index + 1} color={color} destination={plan.destination} />
                    {place.bestTimeToVisit && (
                      <p className="mt-2 flex items-center gap-2 px-1 text-sm text-gray-700">
                        <AlarmClock className="h-4 w-4 text-orange-700" aria-hidden="true" />
                        {place.bestTimeToVisit}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

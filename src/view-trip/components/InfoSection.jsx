import { CalendarPlus, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { fallbackToPlaceholder, usePlacePhoto } from '@/hooks/usePlacePhoto';
import { buildTripCalendar, downloadFile, formatDate, isISODate, slugify, todayISO } from '@/lib/trip';

function Chip({ children }) {
  return <span className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700">{children}</span>;
}

export default function InfoSection({ trip, plan }) {
  const selection = trip.userSelection ?? {};
  const destination = plan.destination || selection.destination || 'your destination';
  const source = plan.source || selection.startingPoint;
  const days = Number(selection.days) || plan.itinerary.length;
  const startDate = isISODate(selection.startDate) ? selection.startDate : '';
  const { url, loading } = usePlacePhoto(plan.destination || selection.destination, { maxWidth: 1600 });

  const shareTrip = async () => {
    const link = window.location.href;
    // Native share sheet on touch devices; copy the link everywhere else.
    if (navigator.share && window.matchMedia?.('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: `Trip to ${destination}`, text: `My ${days}-day trip to ${destination}`, url: link });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Trip link copied to clipboard');
    } catch {
      toast.error('Could not copy the link. Copy it from the address bar instead.');
    }
  };

  const exportCalendar = () => {
    if (plan.itinerary.length === 0) {
      toast.error('This trip has no itinerary to export.');
      return;
    }
    const ics = buildTripCalendar({ id: trip.id, plan: { ...plan, destination }, startDate: startDate || todayISO() });
    downloadFile(`trip-to-${slugify(destination)}.ics`, ics, 'text/calendar;charset=utf-8');
    toast.success('Calendar file downloaded', {
      description: startDate
        ? 'Open it to add every day of the trip to your calendar.'
        : 'No start date was saved for this trip, so the days start today. You can move them in your calendar app.',
    });
  };

  return (
    <section>
      <div className="h-[260px] overflow-hidden rounded-xl bg-gray-100 sm:h-[340px]">
        {loading ? (
          <div className="h-full w-full animate-pulse bg-gray-200" />
        ) : (
          <img src={url} alt={destination} onError={fallbackToPlaceholder} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{trip.userName ? `${trip.userName}'s Trip` : 'Your Trip'}</h1>
          {source && <p className="text-xl font-semibold">Starting from: {source}</p>}
          <p className="text-xl font-semibold">Travelling to: {destination}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {days > 0 && (
              <Chip>
                📅 For {days} {days === 1 ? 'day' : 'days'}
              </Chip>
            )}
            {startDate && <Chip>🗓️ Starts {formatDate(startDate, { day: 'numeric', month: 'short', year: 'numeric' })}</Chip>}
            {selection.companions && <Chip>🥂 With {selection.companions}</Chip>}
            {selection.budget && <Chip>💵 {selection.budget} budget</Chip>}
            {plan.currency && <Chip>💱 Prices in {plan.currency}</Chip>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" onClick={shareTrip}>
            <Share2 /> Share
          </Button>
          <Button variant="outline" onClick={exportCalendar}>
            <CalendarPlus /> Add to calendar
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Print / PDF
          </Button>
        </div>
      </div>
    </section>
  );
}

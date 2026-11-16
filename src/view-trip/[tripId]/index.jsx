import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { doc, getDoc } from 'firebase/firestore';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeTrip } from '@/lib/trip';
import { db } from '@/services/firebaseconfig';
import Hotels from '../components/Hotels';
import InfoSection from '../components/InfoSection';
import Places from '../components/Places';
import Transport from '../components/Transport';
import TripMap from '../components/TripMap';
import Weather from '../components/Weather';

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading trip">
      <div className="h-[260px] animate-pulse rounded-xl bg-gray-200 sm:h-[340px]" />
      <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="h-5 w-2/5 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

function StatusMessage({ title, text, children }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-gray-500">{text}</p>
      <div className="mt-6 flex justify-center gap-3">{children}</div>
    </div>
  );
}

export default function ViewTrip() {
  const { tripId } = useParams();
  const [state, setState] = useState({ status: 'loading', trip: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', trip: null });

    getDoc(doc(db, 'Trips', tripId))
      .then((snapshot) => {
        if (!active) return;
        setState(
          snapshot.exists()
            ? { status: 'ready', trip: { ...snapshot.data(), id: snapshot.id } }
            : { status: 'not-found', trip: null },
        );
      })
      .catch((error) => {
        console.error('Failed to load trip', error);
        if (active) setState({ status: 'error', trip: null });
      });

    return () => {
      active = false;
    };
  }, [tripId, reloadKey]);

  const plan = useMemo(() => normalizeTrip(state.trip?.tripData), [state.trip]);
  const destination = plan.destination || state.trip?.userSelection?.destination;

  useEffect(() => {
    if (!destination) return undefined;
    document.title = `Trip to ${destination} · AI Trip Planner`;
    return () => {
      document.title = 'AI Trip Planner';
    };
  }, [destination]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
      {state.status === 'loading' && <LoadingSkeleton />}

      {state.status === 'not-found' && (
        <StatusMessage title="Trip not found" text="This trip doesn't exist or has been deleted.">
          <Button asChild>
            <Link to="/create-trip">Plan a new trip</Link>
          </Button>
        </StatusMessage>
      )}

      {state.status === 'error' && (
        <StatusMessage title="Couldn't load this trip" text="Please check your connection and try again.">
          <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw /> Try again
          </Button>
        </StatusMessage>
      )}

      {state.status === 'ready' && (
        <>
          <InfoSection trip={state.trip} plan={plan} />
          <Weather trip={state.trip} plan={plan} />
          <TripMap plan={plan} />
          <Transport plan={plan} />
          <Hotels plan={plan} />
          <Places plan={plan} />
        </>
      )}
    </div>
  );
}

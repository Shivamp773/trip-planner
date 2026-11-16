import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/auth';
import { createdAtMs } from '@/lib/trip';
import { db } from '@/services/firebaseconfig';
import UserTripCard from './components/UserTripCard';

const newestFirst = (a, b) => createdAtMs(b) - createdAtMs(a);

export default function MyTrips() {
  const user = useUser();
  const email = user?.email;
  const [state, setState] = useState({ status: 'loading', trips: [] });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!email) return undefined;
    let active = true;
    setState({ status: 'loading', trips: [] });

    // Sorted on the client so no composite Firestore index is required.
    getDocs(query(collection(db, 'Trips'), where('userEmail', '==', email)))
      .then((snapshot) => {
        if (!active) return;
        const trips = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })).sort(newestFirst);
        setState({ status: 'ready', trips });
      })
      .catch((error) => {
        console.error('Failed to load trips', error);
        if (active) setState({ status: 'error', trips: [] });
      });

    return () => {
      active = false;
    };
  }, [email, reloadKey]);

  if (!user) return <Navigate to="/" replace />;

  const restoreTrip = async (trip) => {
    try {
      await setDoc(doc(db, 'Trips', trip.id), trip);
      setState((current) => ({ ...current, trips: [...current.trips, trip].sort(newestFirst) }));
      toast.success('Trip restored');
    } catch (error) {
      console.error(error);
      toast.error('Could not restore the trip.');
    }
  };

  const deleteTrip = async (trip) => {
    const destination = trip.tripData?.destination || trip.userSelection?.destination || 'this destination';
    setState((current) => ({ ...current, trips: current.trips.filter((t) => t.id !== trip.id) }));
    try {
      await deleteDoc(doc(db, 'Trips', trip.id));
      toast.success(`Deleted your trip to ${destination}`, {
        duration: 6000,
        action: { label: 'Undo', onClick: () => restoreTrip(trip) },
      });
    } catch (error) {
      console.error(error);
      setState((current) => ({ ...current, trips: [...current.trips, trip].sort(newestFirst) }));
      toast.error('Could not delete this trip.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My trips</h1>
        <Button asChild>
          <Link to="/create-trip">
            <Plus /> New trip
          </Link>
        </Button>
      </div>

      {state.status === 'loading' && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="space-y-3">
              <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-16 text-center">
          <p className="text-gray-600">We couldn&apos;t load your trips.</p>
          <Button variant="outline" className="mt-4" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw /> Try again
          </Button>
        </div>
      )}

      {state.status === 'ready' && state.trips.length === 0 && (
        <div className="mt-16 rounded-xl border border-dashed p-10 text-center">
          <p className="text-4xl" aria-hidden="true">🧳</p>
          <h2 className="mt-3 text-xl font-semibold">No trips yet</h2>
          <p className="mt-1 text-gray-500">Plan your first trip and it will show up here.</p>
          <Button asChild className="mt-5">
            <Link to="/create-trip">Plan a trip</Link>
          </Button>
        </div>
      )}

      {state.status === 'ready' && state.trips.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {state.trips.map((trip) => (
            <UserTripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
          ))}
        </div>
      )}
    </div>
  );
}

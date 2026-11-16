import { useState } from 'react';
import { useNavigate } from 'react-router';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Autocomplete from '@/components/autocomplete';
import SignInDialog from '@/components/SignInDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LOADING_MESSAGES, MAX_TRIP_DAYS, SelectBudgetOptions, SelectTravelList } from '@/constants/options';
import { getUser } from '@/lib/auth';
import { todayISO } from '@/lib/trip';
import { cn } from '@/lib/utils';
import { TripGenerationError, generateTripPlan } from '@/services/aimodel';
import { db } from '@/services/firebaseconfig';

const INITIAL_FORM = {
  startingPoint: '',
  destination: '',
  destinationCoords: null,
  startDate: '',
  days: '',
  budget: '',
  companions: '',
};

const listFormatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

// Firestore keeps writes pending (instead of failing) while it can't reach the server,
// e.g. when an ad-blocker blocks it, so give up waiting after a while.
const SAVE_TIMEOUT_MS = 25_000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('Save timed out'), { code: 'save-timeout' })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function Field({ id, label, hint, children }) {
  const Label = id ? 'label' : 'h2';
  return (
    <section className="mt-14">
      <Label {...(id && { htmlFor: id })} className="block text-xl font-medium">
        {label}
      </Label>
      <div className="mt-3">{children}</div>
      {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
    </section>
  );
}

function OptionCard({ option, selected, onSelect, extra }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'rounded-lg border p-4 text-left transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300',
        selected ? 'border-pink-300 bg-pink-50 shadow-lg shadow-pink-200/50' : 'border-gray-200 bg-white',
      )}
    >
      <span className="block text-4xl" aria-hidden="true">
        {option.icon}
      </span>
      <span className="mt-2 block text-lg font-bold">{option.title}</span>
      <span className="block text-sm text-gray-500">{option.desc}</span>
      {extra && <span className="mt-1 block text-sm text-gray-500">{extra}</span>}
    </button>
  );
}

export default function CreateTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [signInOpen, setSignInOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (changes) => setForm((current) => ({ ...current, ...changes }));

  const validate = () => {
    const missing = [];
    const days = Number(form.days);
    if (!form.startingPoint.trim()) missing.push('a starting point');
    if (!form.destination.trim()) missing.push('a destination');
    if (!Number.isInteger(days) || days < 1 || days > MAX_TRIP_DAYS) {
      missing.push(`the number of days (1–${MAX_TRIP_DAYS})`);
    }
    if (form.startDate && form.startDate < todayISO()) missing.push('a start date that is not in the past');
    if (!form.budget) missing.push('a budget');
    if (!form.companions) missing.push('who you are travelling with');

    if (missing.length > 0) {
      toast.error(`Please add ${listFormatter.format(missing)}.`, { className: 'sonner-toast-nudge' });
      return false;
    }
    return true;
  };

  const generateTrip = async (user) => {
    setLoading(true);
    const toastId = toast.loading(LOADING_MESSAGES[0]);
    let step = 0;
    const ticker = setInterval(() => {
      step = Math.min(step + 1, LOADING_MESSAGES.length - 1);
      toast.loading(LOADING_MESSAGES[step], { id: toastId });
    }, 5000);

    try {
      const days = Number(form.days);
      const travellers = SelectTravelList.find((option) => option.title === form.companions)?.people;
      const selection = {
        startingPoint: form.startingPoint.trim(),
        destination: form.destination.trim(),
        destinationCoords: form.destinationCoords,
        startDate: form.startDate || null,
        days,
        budget: form.budget,
        companions: form.companions,
      };

      const tripData = await generateTripPlan({ ...selection, travellers });

      const tripRef = doc(collection(db, 'Trips'));
      await withTimeout(
        setDoc(tripRef, {
          id: tripRef.id,
          userSelection: selection,
          tripData,
          userEmail: user.email,
          userName: user.given_name || user.name || '',
          createdAt: serverTimestamp(),
        }),
        SAVE_TIMEOUT_MS,
      );

      toast.success('Your trip is ready!', { id: toastId });
      navigate(`/view-trip/${tripRef.id}`);
    } catch (error) {
      console.error(error);
      let message = 'Could not save your trip. Please try again.';
      if (error instanceof TripGenerationError) message = error.message;
      else if (error?.code === 'permission-denied') message = 'Saving failed: the Firestore security rules blocked it.';
      else if (error?.code === 'save-timeout') {
        message = "Couldn't reach the database to save your trip. Check your connection (or ad-blocker) and try again.";
      }
      toast.error(message, { id: toastId, duration: 8000 });
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading || !validate()) return;
    const user = getUser();
    if (!user) {
      setSignInOpen(true);
      return;
    }
    generateTrip(user);
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-center text-3xl font-bold">Tell us your travel preferences 🏕️🌴🌊</h1>
      <p className="mt-3 text-center text-xl text-gray-500">
        Just provide some basic information, and our trip planner will generate a customized itinerary based on
        your preferences.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Field id="startingPoint" label="Where are you starting at? 🏡">
          <Autocomplete
            id="startingPoint"
            value={form.startingPoint}
            onChange={(text) => update({ startingPoint: text })}
            onSelect={(place) => update({ startingPoint: place.label })}
          />
        </Field>

        <Field id="destination" label="What is your destination of choice? 📍">
          <Autocomplete
            id="destination"
            value={form.destination}
            onChange={(text) => update({ destination: text, destinationCoords: null })}
            onSelect={(place) => update({ destination: place.label, destinationCoords: { lat: place.lat, lng: place.lng } })}
          />
        </Field>

        <div className="grid gap-x-6 sm:grid-cols-2">
          <Field id="days" label="How many days are you planning to stay?">
            <Input
              id="days"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_TRIP_DAYS}
              step={1}
              placeholder="Ex. 3"
              value={form.days}
              onChange={(event) => update({ days: event.target.value })}
              className="h-12 text-base md:text-base"
            />
          </Field>
          <Field id="startDate" label="When does your trip start?" hint="Optional: used for the weather forecast and calendar export.">
            <Input
              id="startDate"
              type="date"
              min={todayISO()}
              value={form.startDate}
              onChange={(event) => update({ startDate: event.target.value })}
              className="h-12 text-base md:text-base"
            />
          </Field>
        </div>

        <Field label="What is your budget?">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {SelectBudgetOptions.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                selected={form.budget === option.title}
                onSelect={() => update({ budget: option.title })}
              />
            ))}
          </div>
        </Field>

        <Field label="Who are you planning to go with on your next trip?">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {SelectTravelList.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                extra={option.people}
                selected={form.companions === option.title}
                onSelect={() => update({ companions: option.title })}
              />
            ))}
          </div>
        </Field>

        <div className="mt-14 flex justify-end">
          <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles /> Generate Trip
              </>
            )}
          </Button>
        </div>
      </form>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} onSignedIn={generateTrip} />
    </div>
  );
}

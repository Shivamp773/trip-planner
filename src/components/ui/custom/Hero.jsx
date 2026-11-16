import { Link } from 'react-router';
import { ArrowRight, CalendarPlus, CloudSun, Map as MapIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI itineraries',
    text: 'Day-by-day plans with hotels, trains and flights, priced in your local currency.',
  },
  {
    icon: MapIcon,
    title: 'Interactive trip map',
    text: 'Every hotel and stop pinned on a map, colour-coded by day.',
  },
  {
    icon: CloudSun,
    title: 'Live weather',
    text: 'The forecast for your destination, matched to your travel dates.',
  },
  {
    icon: CalendarPlus,
    title: 'Share & export',
    text: 'Share a link, save a PDF, or add every day of the trip to your calendar.',
  },
];

export default function Hero() {
  return (
    <>
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#f56551] md:text-6xl">
            Discover Your Next Adventure with AI
          </h1>
          <p className="mt-5 text-xl font-bold text-gray-100 md:text-2xl">
            Trip planner with personalized itineraries, tickets, hotels, and much more
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-200 md:text-lg">
            Your personal trip planner and curator, creating custom itineraries tailored to your interests, style,
            and budget.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-[#f56551] text-base text-white shadow-lg transition hover:scale-105 hover:bg-[#e53e3e]"
          >
            <Link to="/create-trip">
              Get Started for Free! <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">Everything for your trip, in one place</h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-[#f56551]">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

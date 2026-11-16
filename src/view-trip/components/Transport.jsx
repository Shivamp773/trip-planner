import { Car, Clock, Plane, TrainFront } from 'lucide-react';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
      <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function OptionCard({ title, subtitle, details }) {
  return (
    <li className="break-inside-avoid rounded-lg border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="font-semibold text-blue-800">{title}</p>
      {subtitle && <p className="text-sm text-blue-600">{subtitle}</p>}
      <dl className="mt-3 space-y-1 text-sm">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="font-medium text-blue-600">{label}</dt>
              <dd className="text-right text-gray-700">{value}</dd>
            </div>
          ))}
      </dl>
    </li>
  );
}

function OptionGroup({ icon: Icon, title, options }) {
  if (options.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-800">
        <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" /> {title}
      </h3>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option, index) => (
          <OptionCard key={`${option.title}-${index}`} {...option} />
        ))}
      </ul>
    </div>
  );
}

const schedule = (option) => [
  ['Departure', option.departureTime],
  ['Arrival', option.arrivalTime],
  ['Duration', option.duration],
  ['Price', option.price],
];

export default function Transport({ plan }) {
  const { trains, flights, distanceByRoad, timeByRoad } = plan;
  if (trains.length === 0 && flights.length === 0 && !distanceByRoad && !timeByRoad) return null;

  const trainOptions = trains.map((train) => ({
    title: train.name || `Train ${train.number}`,
    subtitle: train.name && train.number ? `Train no. ${train.number}` : '',
    details: schedule(train),
  }));
  const flightOptions = flights.map((flight) => ({
    title: [flight.airline, flight.flightNumber].filter(Boolean).join(' '),
    details: schedule(flight),
  }));

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">Travel</h2>
      {(distanceByRoad || timeByRoad) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {distanceByRoad && <Stat icon={Car} label="Distance by road" value={distanceByRoad} />}
          {timeByRoad && <Stat icon={Clock} label="Time to travel by road" value={timeByRoad} />}
        </div>
      )}
      <OptionGroup icon={TrainFront} title="Trains" options={trainOptions} />
      <OptionGroup icon={Plane} title="Flights" options={flightOptions} />
      <p className="mt-4 text-xs text-gray-500">
        Schedules and fares are AI-generated estimates. Please confirm with the operator before booking.
      </p>
    </section>
  );
}

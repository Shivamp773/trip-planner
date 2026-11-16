import HotelCard from './HotelCard';

export default function Hotels({ plan }) {
  if (plan.hotels.length === 0) return null;
  return (
    <section className="py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800 md:text-3xl">Hotel Recommendations</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plan.hotels.map((hotel, index) => (
          <HotelCard key={`${hotel.name}-${index}`} hotel={hotel} destination={plan.destination} />
        ))}
      </div>
    </section>
  );
}

import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Primary model, then Google's rolling "latest Flash" alias as a safety net, so a model
// retirement or a busy model degrades gracefully instead of breaking trip generation.
const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-flash-latest';

export class TripGenerationError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'TripGenerationError';
  }
}

let client;
function getClient() {
  if (!API_KEY) {
    throw new TripGenerationError(
      'Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.',
    );
  }
  // Created lazily: the browser SDK throws on construction when no key is set.
  client ??= new GoogleGenAI({ apiKey: API_KEY });
  return client;
}

// ---------- Response schema (JSON Schema): guarantees the shape the UI renders ----------

const text = (description) => ({ type: 'string', description });
const number = (description) => ({ type: 'number', description });
const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties) });
const list = (items, description) => ({ type: 'array', items, description });

const coordinates = {
  ...object({ latitude: { type: 'number' }, longitude: { type: 'number' } }),
  description: 'Accurate coordinates in decimal degrees',
};

const TRIP_SCHEMA = object({
  source: text('Starting point'),
  destination: text('Destination'),
  currency: text('ISO 4217 code of the currency every price is quoted in'),
  distanceByRoad: text('Road distance from the starting point to the destination, e.g. "280 km"'),
  timeToTravelByRoad: text('Typical driving time, e.g. "5 h 30 min"'),
  travelDetails: object({
    trains: list(
      object({
        name: text('Train name'),
        number: text('Train number'),
        departureTime: text('Departure time'),
        arrivalTime: text('Arrival time'),
        duration: text('Journey duration'),
        price: text('Typical fare with currency symbol'),
      }),
      'Up to 5 train options; empty if no train connects the two places',
    ),
    flights: list(
      object({
        airline: text('Airline'),
        flightNumber: text('Flight number'),
        departureTime: text('Departure time'),
        arrivalTime: text('Arrival time'),
        duration: text('Flight duration'),
        price: text('Typical fare with currency symbol'),
      }),
      'Up to 5 flight options; empty if flying is not practical',
    ),
  }),
  hotels: list(
    object({
      name: text('Hotel name'),
      address: text('Full street address'),
      price: text('Price per night with currency symbol'),
      rating: number('Guest rating out of 5'),
      description: text('One-sentence description'),
      geoCoordinates: coordinates,
    }),
    '5 hotels that fit the budget',
  ),
  itinerary: list(
    object({
      day: { type: 'integer', description: 'Day number, starting at 1' },
      theme: text('Short theme for the day'),
      places: list(
        object({
          name: text('Place name'),
          address: text('Full address'),
          details: text('1-2 sentence description'),
          geoCoordinates: coordinates,
          ticketPricing: text('Ticket price with currency symbol, or "Free"'),
          rating: number('Rating out of 5'),
          bestTimeToVisit: text('Morning, Afternoon or Evening'),
          timeToTravelFromPreviousLocation: text('Travel time from the previous stop, e.g. "15 min by taxi"'),
        }),
        '3-4 places in a sensible visiting order',
      ),
    }),
    'Exactly one entry per day of the trip',
  ),
});

const SYSTEM_INSTRUCTION = `You are an expert travel planner. Create a realistic, detailed trip plan and return it as JSON.

Rules:
- Quote every price in the local currency of the country the starting point is in, and set "currency" to that ISO 4217 code.
- "distanceByRoad" and "timeToTravelByRoad": road distance and typical driving time from the starting point to the destination. If they are not connected by road, use "Not reachable by road".
- "travelDetails.trains": up to 5 real train services on this route (name, number, departure and arrival times, duration, fare). Use an empty array if no train connects the two places.
- "travelDetails.flights": up to 5 real flight options (airline, flight number, departure and arrival times, duration, fare). Use an empty array if flying is not practical (e.g. very short distances).
- "hotels": 5 hotels that fit the budget, each with a full street address, price per night, rating out of 5, a one-sentence description and accurate coordinates.
- "itinerary": exactly one entry per trip day, numbered from 1. Give each day a short theme and 3-4 places in a sensible visiting order. For each place give its full address, a 1-2 sentence description, accurate coordinates, ticket price ("Free" if none), rating out of 5, best time to visit (Morning, Afternoon or Evening) and travel time from the previous stop.
- Tailor everything to the travellers and budget (family-friendly for families, romantic for couples, good value for low budgets).
- If a start date is given, account for the season, local events and typical opening days.
- Only use real, verifiable places and hotels. Never use placeholders such as "Example Hotel".

JSON fields: source, destination, currency, distanceByRoad, timeToTravelByRoad, travelDetails { trains[] { name, number, departureTime, arrivalTime, duration, price }, flights[] { airline, flightNumber, departureTime, arrivalTime, duration, price } }, hotels[] { name, address, price, rating, description, geoCoordinates { latitude, longitude } }, itinerary[] { day, theme, places[] { name, address, details, geoCoordinates { latitude, longitude }, ticketPricing, rating, bestTimeToVisit, timeToTravelFromPreviousLocation } }.`;

function buildPrompt({ startingPoint, destination, days, startDate, budget, companions, travellers }) {
  const plural = days === 1 ? '' : 's';
  return [
    'Plan this trip:',
    `- Starting point: ${startingPoint}`,
    `- Destination: ${destination}`,
    `- Duration: ${days} day${plural} (return exactly ${days} itinerary day${plural})`,
    `- Start date: ${startDate || 'flexible'}`,
    `- Travellers: ${companions}${travellers ? ` (${travellers} people)` : ''}`,
    `- Budget: ${budget}`,
  ].join('\n');
}

function parsePlan(responseText) {
  if (!responseText) throw new SyntaxError('Gemini returned an empty response');
  const json = responseText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const plan = JSON.parse(json);
  if (!plan || typeof plan !== 'object' || !Array.isArray(plan.itinerary) || plan.itinerary.length === 0) {
    throw new SyntaxError('Gemini returned an incomplete trip plan');
  }
  return plan;
}

const isAuthError = (error) =>
  error?.status === 401 ||
  error?.status === 403 ||
  (error?.status === 400 && /api[\s_-]?key/i.test(error?.message ?? ''));

function friendlyMessage(error) {
  if (isAuthError(error)) return 'Gemini rejected the API key. Check VITE_GEMINI_API_KEY in your .env file.';
  if (error?.status === 429) return 'Gemini rate limit reached. Please wait a minute and try again.';
  if (error?.status >= 500) return 'Gemini is busy right now. Please try again in a moment.';
  if (error instanceof SyntaxError) return 'Gemini returned an incomplete plan. Please try again.';
  if (error instanceof TypeError) return 'Could not reach Gemini. Check your internet connection.';
  return 'Could not generate your trip. Please try again.';
}

/**
 * Generates a trip plan. Each call is stateless (no shared chat history between trips).
 * Tries the primary model with a strict schema, then the fallback model, and finally the
 * fallback without a schema in case a model rejects schema features.
 */
export async function generateTripPlan(details) {
  const ai = getClient();
  const contents = buildPrompt(details);
  const attempts = [
    { model: PRIMARY_MODEL, structured: true },
    { model: FALLBACK_MODEL, structured: true },
    { model: FALLBACK_MODEL, structured: false },
  ];

  let lastError;
  for (const { model, structured } of attempts) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          ...(structured && { responseJsonSchema: TRIP_SCHEMA }),
          maxOutputTokens: 32768,
          httpOptions: { timeout: 120_000 },
        },
      });
      return parsePlan(response.text);
    } catch (error) {
      lastError = error;
      console.warn(`Trip generation with ${model}${structured ? '' : ' (no schema)'} failed:`, error);
      if (isAuthError(error)) break; // a different model will not fix a bad key
    }
  }

  throw new TripGenerationError(friendlyMessage(lastError), { cause: lastError });
}

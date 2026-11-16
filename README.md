# AI Trip Planner

Tell it where you're starting, where you're going, for how long, your budget and who's coming. It generates a complete day-by-day plan with hotels, trains and flights, then shows it with an interactive map, live weather, and share, PDF and calendar export.

## Features

- **AI itineraries**: Google Gemini returns a structured plan, validated against a JSON schema. It includes:
  - places for each day, with timings, ticket prices and ratings
  - hotels that fit the budget
  - road distance and train/flight options
  
  All prices are in the currency of the starting country.
- **Location search**: city suggestions as you type. Free text works too.
- **Interactive trip map**: every hotel and stop on an OpenStreetMap map, numbered and colour-coded by day, with route lines and a day filter.
- **Live weather**: the forecast for your trip dates when they're within 16 days, otherwise the 7-day outlook. Toggle between °C and °F.
- **Share & export**:
  - copy or share a link to the trip
  - print it or save it as a PDF (print-optimised layout)
  - download an `.ics` file that adds each day to Google, Apple or Outlook Calendar
- **My trips**: all saved trips, newest first, with delete and undo.
- **Sign in with Google**, place photos, a responsive layout, and fallbacks when an external service is unavailable.

The location search, map, weather and export features use free services that need no API keys.

## Tech stack

React 18 · Vite 6 · React Router 7 (lazy-loaded routes) · Tailwind CSS + shadcn/ui (Radix) · Google Gemini (`@google/genai`) · Firebase Firestore · Leaflet + OpenStreetMap · Open-Meteo · Google OAuth (`@react-oauth/google`)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (22 LTS recommended), with npm

### 1. Install dependencies

```bash
npm install
```

### 2. Add the environment variables

Copy the template, then fill in the values:

```bash
cp .env.example .env            # macOS / Linux
Copy-Item .env.example .env     # Windows PowerShell
```

| Variable | Required | Used for | Where to get it |
| --- | --- | --- | --- |
| `VITE_GEMINI_API_KEY` | Yes | Generating trip plans | [Google AI Studio](https://aistudio.google.com/apikey) → *Create API key* |
| `VITE_GOOGLE_AUTH_CLIENT_ID` | Yes | Sign in with Google | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Create credentials* → *OAuth client ID* → *Web application* |
| `VITE_GOMAPS_API_KEY` | Optional | Hotel and place photos | [GoMaps Pro](https://map.gomaps.pro). Without it, photos come from Wikipedia or a placeholder image. |

> **Google sign-in:** the OAuth client's *Authorized JavaScript origins* must include `http://localhost:5173` (plus your production URL when you deploy). The dev server always uses port 5173 for this reason. If the port is busy, it stops with an error rather than switching to another port.

### 3. Start the app

```bash
npm run dev
```

Open <http://localhost:5173>. Restart the dev server whenever you change `.env`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server on <http://localhost:5173> |
| `npm run build` | Creates a production build in `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |

## Data storage (Firebase)

Trips are saved in the `Trips` collection of the Firestore database configured in [src/services/firebaseconfig.js](src/services/firebaseconfig.js). This web config is public by design, so it is not a secret.

The project's Firestore security rules must allow the app to read, create and delete documents in `Trips`. To use your own Firebase project, create a Firestore database and replace the config object with your project's web app config.

## Project structure

```
src/
├── main.jsx                 # Router (lazy-loaded pages) and providers
├── App.jsx                  # Root layout, 404 and error screens
├── index.css                # Tailwind theme, map and print styles
├── components/
│   ├── autocomplete.jsx     # Location search with suggestions
│   ├── SignInDialog.jsx     # Google sign-in dialog
│   └── ui/                  # shadcn/ui primitives, Header, Hero, Footer
├── constants/options.jsx    # Budget and traveller options
├── create-trip/             # Trip form and generation flow
├── my-trips/                # Saved trips
├── view-trip/               # Trip page: summary, weather, map, travel, hotels, itinerary
├── hooks/usePlacePhoto.js   # Place photos (GoMaps → Wikipedia → placeholder), cached
├── lib/
│   ├── auth.js              # Signed-in user store (useUser) and Google profile
│   ├── trip.js              # Trip data normalisation, dates, calendar export
│   └── utils.js             # Tailwind class helper
└── services/
    ├── aimodel.js           # Gemini prompt, response schema and model fallback
    ├── firebaseconfig.js    # Firebase / Firestore setup
    └── openMeteo.js         # Place search and weather (no API key)
```

## Deployment

The app is a static site. [vercel.json](vercel.json) sends every route to `index.html` so page links work.

When you deploy:

1. Add the three `VITE_*` variables in your host's environment settings.
2. Add the production URL to the OAuth client's authorized origins.

## Notes and limitations

- Itineraries, schedules and prices are AI-generated estimates. Check them before booking.
- This is a front-end-only app, so the `VITE_*` keys are bundled into the browser code. Restrict them to your domains and set quotas in Google AI Studio and Google Cloud.
- Sign-in uses Google OAuth in the browser rather than Firebase Authentication. That means Firestore rules can't verify who owns a trip. Moving to Firebase Authentication is the next step before production use.
- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Weather data by [Open-Meteo.com](https://open-meteo.com/).

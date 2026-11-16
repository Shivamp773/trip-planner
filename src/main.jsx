import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App, { NotFound, PageLoader, RouteError } from './App.jsx';
import Hero from './components/ui/custom/Hero';
import { Toaster } from './components/ui/sonner';
import { GOOGLE_CLIENT_ID } from './lib/auth';
import './index.css';

// Pages are code-split: the AI SDK, Firestore queries and the map only load where they're needed.
const lazyPage = (load) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        // Page-level errors render inside the layout, so the header stays usable.
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Hero /> },
          { path: 'create-trip', lazy: lazyPage(() => import('./create-trip/index.jsx')) },
          { path: 'view-trip/:tripId', lazy: lazyPage(() => import('./view-trip/[tripId]/index.jsx')) },
          { path: 'my-trips', lazy: lazyPage(() => import('./my-trips/index.jsx')) },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
      <Toaster />
    </GoogleOAuthProvider>
  </StrictMode>,
);

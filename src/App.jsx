import { Link, Outlet, ScrollRestoration, useRouteError } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/ui/custom/Footer';
import Header from '@/components/ui/custom/Header';

/** Root layout shared by every page. */
export default function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <LoaderCircle className="h-8 w-8 animate-spin text-[#f56551]" aria-hidden="true" />
    </div>
  );
}

function Message({ title, text, children }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-gray-500">{text}</p>
      <div className="mt-6 flex justify-center gap-3">{children}</div>
    </div>
  );
}

export function NotFound() {
  return (
    <Message title="Page not found" text="The page you are looking for doesn't exist or has moved.">
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </Message>
  );
}

export function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <Message title="Something went wrong" text="An unexpected error occurred while loading this page.">
      <Button onClick={() => window.location.reload()}>Reload page</Button>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </Message>
  );
}

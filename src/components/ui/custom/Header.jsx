import { useState } from 'react';
import { Link } from 'react-router';
import { LogOut, Map as MapIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';
import SignInDialog from '@/components/SignInDialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { signOut, useUser } from '@/lib/auth';

function Avatar({ user }) {
  const [failed, setFailed] = useState(false);
  const initial = (user.given_name || user.name || user.email || '?').charAt(0).toUpperCase();

  if (!user.picture || failed) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f56551] font-semibold text-white">
        {initial}
      </span>
    );
  }
  return (
    <img
      src={user.picture}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-9 w-9 rounded-full object-cover"
    />
  );
}

export default function Header() {
  const user = useUser();
  const [signInOpen, setSignInOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    toast.success('Signed out');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="AI Trip Planner home">
          <img src="/logo.svg" alt="AI Trip Planner" className="h-7 w-auto" />
        </Link>

        {user ? (
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/create-trip" aria-label="Create trip">
                <Plus />
                <span className="hidden sm:inline">Create trip</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/my-trips" aria-label="My trips">
                <MapIcon />
                <span className="hidden sm:inline">My trips</span>
              </Link>
            </Button>
            <Popover>
              <PopoverTrigger
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Account menu"
              >
                <Avatar user={user} />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <Button variant="ghost" className="mt-3 w-full justify-start px-2" onClick={handleSignOut}>
                  <LogOut /> Log out
                </Button>
              </PopoverContent>
            </Popover>
          </nav>
        ) : (
          <Button onClick={() => setSignInOpen(true)}>Sign in</Button>
        )}
      </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </header>
  );
}

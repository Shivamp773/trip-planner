import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GOOGLE_CLIENT_ID, signInWithGoogleToken } from '@/lib/auth';

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

// Only rendered when a client ID is configured: initialising Google's client without one throws.
function GoogleSignInButton({ onSignedIn }) {
  const [pending, setPending] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async ({ access_token: accessToken }) => {
      try {
        const user = await signInWithGoogleToken(accessToken);
        toast.success(`Welcome, ${user.given_name || user.name}!`);
        onSignedIn(user);
      } catch (error) {
        console.error(error);
        toast.error('Could not load your Google profile. Please try again.');
      } finally {
        setPending(false);
      }
    },
    onError: (error) => {
      console.error(error);
      setPending(false);
      toast.error('Google sign-in was not completed.');
    },
    onNonOAuthError: (error) => {
      setPending(false);
      if (error?.type === 'popup_failed_to_open') {
        toast.error('Please allow pop-ups for this site to sign in with Google.');
      }
    },
  });

  const handleClick = () => {
    if (!window.google?.accounts?.oauth2) {
      toast.error('Google sign-in is still loading. Please try again in a moment.');
      return;
    }
    setPending(true);
    login();
  };

  return (
    <Button size="lg" variant="outline" className="w-full gap-3" disabled={pending} onClick={handleClick}>
      {pending ? <LoaderCircle className="animate-spin" /> : <GoogleLogo />}
      Continue with Google
    </Button>
  );
}

export default function SignInDialog({ open, onOpenChange, onSignedIn }) {
  const handleSignedIn = (user) => {
    onOpenChange(false);
    onSignedIn?.(user);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <img src="/logo.svg" alt="" className="mx-auto mb-4 h-7 w-auto sm:mx-0" />
          <DialogTitle>Sign in with Google</DialogTitle>
          <DialogDescription>Securely sign in to generate trips and save them to “My trips”.</DialogDescription>
        </DialogHeader>
        {GOOGLE_CLIENT_ID ? (
          <GoogleSignInButton onSignedIn={handleSignedIn} />
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Google sign-in isn’t configured. Add <code>VITE_GOOGLE_AUTH_CLIENT_ID</code> to your{' '}
            <code>.env</code> file and restart the dev server.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

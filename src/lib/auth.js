import { useSyncExternalStore } from 'react';
import { googleLogout } from '@react-oauth/google';

// The signed-in Google profile lives in localStorage so it survives reloads.
// Components subscribe through useUser(), so sign-in/out updates the UI without page reloads.

const STORAGE_KEY = 'user';
const CHANGE_EVENT = 'trip-planner:auth-change';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID || '';

let cachedRaw;
let cachedUser = null;

export function getUser() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (e.g. strict privacy mode): treat as signed out.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      cachedUser = parsed?.email ? parsed : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

function subscribe(onChange) {
  const onStorage = (event) => {
    if (event.key === null || event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', onStorage); // other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useUser() {
  return useSyncExternalStore(subscribe, getUser, () => null);
}

function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } finally {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/** Exchanges a Google OAuth access token for the user's profile and stores it. */
export async function signInWithGoogleToken(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Google profile request failed (${response.status})`);

  const profile = await response.json();
  if (!profile.email) throw new Error('This Google account has no email address');

  const user = {
    email: profile.email,
    name: profile.name || profile.email,
    given_name: profile.given_name || '',
    picture: profile.picture || '',
  };
  setStoredUser(user);
  return user;
}

export function signOut() {
  googleLogout();
  setStoredUser(null);
}

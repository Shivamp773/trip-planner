import { useEffect, useState } from 'react';

// Place photos: GoMaps (Google Places-compatible) first, then a keyless Wikipedia fallback,
// then a local placeholder. Results are cached in memory and sessionStorage so every photo
// is looked up at most once per session (also avoids duplicate requests from React StrictMode).

export const PLACEHOLDER_PHOTO = '/placeholder.jpg';

const GOMAPS_KEY = import.meta.env.VITE_GOMAPS_API_KEY;
const GOMAPS_PLACES = 'https://maps.gomaps.pro/maps/api/place';
const CACHE_PREFIX = 'photo:v2:';
const memoryCache = new Map();

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

async function fromGoMaps(query, maxWidth) {
  if (!GOMAPS_KEY) return null;
  const key = encodeURIComponent(GOMAPS_KEY);
  const find = await getJson(
    `${GOMAPS_PLACES}/findplacefromtext/json?input=${encodeURIComponent(query)}` +
      `&inputtype=textquery&fields=place_id,photos&language=en&key=${key}`,
  );
  const candidate = find?.candidates?.[0];
  let reference = candidate?.photos?.[0]?.photo_reference;

  if (!reference && candidate?.place_id) {
    const details = await getJson(
      `${GOMAPS_PLACES}/details/json?place_id=${encodeURIComponent(candidate.place_id)}` +
        `&fields=photos&language=en&key=${key}`,
    );
    reference = details?.result?.photos?.[0]?.photo_reference;
  }

  return reference
    ? `${GOMAPS_PLACES}/photo?photo_reference=${encodeURIComponent(reference)}&maxwidth=${maxWidth}&key=${key}`
    : null;
}

async function fromWikipedia(query, maxWidth) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: String(maxWidth),
  });
  const data = await getJson(`https://en.wikipedia.org/w/api.php?${params}`);
  const [page] = Object.values(data?.query?.pages ?? {});
  return page?.thumbnail?.source ?? null;
}

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable: the in-memory cache still works.
  }
}

/** Resolves to a photo URL for the query, or null if none was found. */
export function fetchPlacePhoto(query, { allowWikipedia = true, maxWidth = 800 } = {}) {
  const key = `${CACHE_PREFIX}${maxWidth}:${allowWikipedia ? 'w' : 'g'}:${query.toLowerCase()}`;
  if (memoryCache.has(key)) return memoryCache.get(key);

  const stored = readSession(key);
  if (stored !== null) {
    const cached = Promise.resolve(stored || null);
    memoryCache.set(key, cached);
    return cached;
  }

  const request = (async () => {
    let failed = false;
    let url = null;
    try {
      url = await fromGoMaps(query, maxWidth);
    } catch {
      failed = true;
    }
    if (!url && allowWikipedia) {
      try {
        url = await fromWikipedia(query, maxWidth);
        failed = false;
      } catch {
        failed = true;
      }
    }
    // Remember "no photo" answers, but retry after network errors.
    if (url || !failed) writeSession(key, url ?? '');
    else memoryCache.delete(key);
    return url;
  })();

  memoryCache.set(key, request);
  return request;
}

/**
 * React hook returning `{ url, loading }` for a place photo. `url` is always usable:
 * it falls back to the placeholder image while loading or when nothing is found.
 * Set `allowWikipedia: false` for things Wikipedia won't have a reliable photo of (e.g. hotels).
 */
export function usePlacePhoto(query, { allowWikipedia = true, maxWidth = 800 } = {}) {
  const [result, setResult] = useState({ query: null, url: null });

  useEffect(() => {
    if (!query) return undefined;
    let active = true;
    fetchPlacePhoto(query, { allowWikipedia, maxWidth }).then((url) => {
      if (active) setResult({ query, url });
    });
    return () => {
      active = false;
    };
  }, [query, allowWikipedia, maxWidth]);

  const resolved = result.query === query;
  return {
    url: (resolved && result.url) || PLACEHOLDER_PHOTO,
    loading: Boolean(query) && !resolved,
  };
}

/** `onError` handler for <img>: swap a broken photo for the placeholder (once). */
export function fallbackToPlaceholder(event) {
  const img = event.currentTarget;
  if (!img.src.endsWith(PLACEHOLDER_PHOTO)) img.src = PLACEHOLDER_PHOTO;
}

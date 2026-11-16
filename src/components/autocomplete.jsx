import { useEffect, useId, useState } from 'react';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchPlaces } from '@/services/openMeteo';

const MIN_QUERY_LENGTH = 2;
const searchTerm = (text) => text.split(',')[0].trim();

/**
 * Location input with keyless city suggestions (Open-Meteo geocoding).
 * Free text is always accepted: picking a suggestion is optional.
 *
 * onChange(text)  -> every keystroke
 * onSelect(place) -> when a suggestion is chosen: { id, label, lat, lng }
 */
export default function Autocomplete({ id, value, onChange, onSelect, placeholder = 'Search for a city or place' }) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const listId = `${inputId}-suggestions`;

  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ term: '', items: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState('idle'); // idle | loading | error

  const term = searchTerm(value);

  useEffect(() => {
    if (!open || term.length < MIN_QUERY_LENGTH) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const items = await searchPlaces(term, { signal: controller.signal });
        setResults({ term, items });
        setActiveIndex(-1);
        setStatus('idle');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setResults({ term, items: [] });
          setStatus('error');
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, open]);

  // Previous suggestions stay visible while the next search runs, so the list doesn't flicker.
  const suggestions = results.items;
  const isCurrent = results.term === term;
  const showPanel =
    open && term.length >= MIN_QUERY_LENGTH && (suggestions.length > 0 || isCurrent || status === 'error');

  const select = (place) => {
    onSelect(place);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!showPanel || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      select(suggestions[activeIndex]);
    }
  };

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-pink-400"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={showPanel && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const text = event.target.value;
          if (searchTerm(text).length < MIN_QUERY_LENGTH) setResults({ term: '', items: [] });
          onChange(text);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        className="w-full rounded-lg border-2 border-pink-200 bg-pink-50 py-3 pl-12 pr-11 text-lg shadow-sm transition-all placeholder:text-pink-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300"
      />
      {open && status === 'loading' && (
        <LoaderCircle
          className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-pink-400"
          aria-hidden="true"
        />
      )}

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          // Keep focus in the input so a click on the list doesn't close it before selecting.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-pink-100 bg-white py-1 shadow-lg"
        >
          {suggestions.map((place, index) => (
            <li
              key={place.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => select(place)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-gray-800',
                index === activeIndex && 'bg-pink-50',
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-pink-400" aria-hidden="true" />
              <span className="truncate">{place.label}</span>
            </li>
          ))}
          {suggestions.length === 0 && (status === 'error' || isCurrent) && (
            <li className="px-4 py-2.5 text-sm text-gray-500">
              {status === 'error'
                ? 'Suggestions are unavailable right now. You can keep typing.'
                : `No suggestions found. We'll use “${value.trim()}” as typed.`}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

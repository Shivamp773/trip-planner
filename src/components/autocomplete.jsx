import React, { useState } from 'react';

const Autocomplete = ({ onSelect }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
   
    onSelect({ description: value });
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Enter a location"
          className="w-full p-3 pl-12 text-lg bg-pink-50 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-300 placeholder-pink-400 transition-all shadow-md"
        />
        <svg
          className="absolute left-3 top-3.5 h-6 w-6 text-pink-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      {/* Optional message */}
      <ul className="mt-2 bg-white border border-pink-100 rounded-lg shadow-lg">
        <li className="p-3 text-gray-500">Manual entry mode (no suggestions)</li>
      </ul>
    </div>
  );
};

export default Autocomplete;

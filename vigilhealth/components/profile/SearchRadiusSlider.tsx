'use client';

import { useState } from 'react';

interface SearchRadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function SearchRadiusSlider({
  value,
  onChange,
}: SearchRadiusSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor="search-radius" className="text-sm font-medium text-gray-700">
          Default search radius for nearby locations
        </label>
        <span className="text-lg font-semibold text-blue-600">
          {localValue} {localValue === 1 ? 'mile' : 'miles'}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          id="search-radius"
          min="1"
          max="50"
          step="1"
          value={localValue}
          onChange={handleChange}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((localValue - 1) / 49) * 100}%, #e5e7eb ${((localValue - 1) / 49) * 100}%, #e5e7eb 100%)`,
          }}
        />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>1 mile</span>
          <span>25 miles</span>
          <span>50 miles</span>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        This radius will be used when searching for nearby pharmacies, testing
        sites, and other health services. You can adjust this for individual
        searches.
      </p>

      {/* Visual indicator for common distances */}
      <div className="rounded-md bg-gray-50 p-3">
        <p className="mb-2 text-xs font-medium text-gray-700">
          Distance reference:
        </p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>
            • <strong>1-5 miles:</strong> Walking/biking distance, immediate
            neighborhood
          </li>
          <li>
            • <strong>5-15 miles:</strong> Short drive, local area
          </li>
          <li>
            • <strong>15-30 miles:</strong> Nearby towns and suburbs
          </li>
          <li>
            • <strong>30-50 miles:</strong> Regional area, longer trips
          </li>
        </ul>
      </div>
    </div>
  );
}

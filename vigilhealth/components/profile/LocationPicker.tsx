'use client';

import { Search, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface LocationPickerProps {
  location: { lat: number; lng: number } | null;
  city: string;
  state: string;
  onLocationChange: (
    location: { lat: number; lng: number } | null,
    city: string,
    state: string
  ) => void;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text?: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
  }>;
  place_type: string[];
}

export function LocationPicker({
  location,
  city,
  state,
  onLocationChange,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize search query from existing location
  useEffect(() => {
    if (city && state) {
      setSearchQuery(`${city}, ${state}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken || mapboxToken === 'your_mapbox_public_token_here') {
        throw new Error('Mapbox token not configured');
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=US&types=place,locality,neighborhood,address&limit=5`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to search locations. Please try again.');
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300);
  };

  const handleSelectLocation = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;

    // Extract city and state from context
    let selectedCity = '';
    let selectedState = '';

    // Check if the feature itself is a place (city)
    if (feature.place_type.includes('place')) {
      selectedCity = feature.text || '';
    }

    // Extract from context
    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('place.')) {
          selectedCity = ctx.text;
        } else if (ctx.id.startsWith('region.')) {
          selectedState = ctx.text;
        }
      }
    }

    // If still no city, try to extract from place_name
    if (!selectedCity) {
      const parts = feature.place_name.split(',');
      if (parts.length > 0) {
        selectedCity = parts[0].trim();
      }
    }

    setSearchQuery(feature.place_name);
    setShowSuggestions(false);
    onLocationChange({ lat, lng }, selectedCity, selectedState);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setSearching(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get city and state
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (!mapboxToken || mapboxToken === 'your_mapbox_public_token_here') {
            throw new Error('Mapbox token not configured');
          }

          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place,locality`
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }

          const data = await response.json();
          const feature = data.features[0];

          if (feature) {
            handleSelectLocation(feature);
          } else {
            // Fallback if no feature found
            onLocationChange({ lat: latitude, lng: longitude }, '', '');
            setSearchQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          // Still set the location even if reverse geocoding fails
          onLocationChange({ lat: latitude, lng: longitude }, '', '');
          setSearchQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setSearching(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Failed to get your location. Please search manually.');
        setSearching(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={wrapperRef}>
        <label
          htmlFor="location-search"
          className="block text-sm font-medium text-gray-700"
        >
          Search for your location
        </label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {searching ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            id="location-search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Enter city, address, or ZIP code"
            className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
            <ul className="max-h-60 overflow-auto rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {suggestions.map((feature) => (
                <li
                  key={feature.id}
                  onClick={() => handleSelectLocation(feature)}
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50"
                >
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="block truncate">{feature.place_name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={searching}
        className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MapPin className="mr-1 h-4 w-4" />
        Use my current location
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {location && (
        <div className="rounded-md bg-gray-50 p-3 text-sm">
          <p className="font-medium text-gray-700">Selected Location:</p>
          <p className="text-gray-600">
            {city && state ? `${city}, ${state}` : searchQuery}
          </p>
          <p className="text-xs text-gray-500">
            Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}

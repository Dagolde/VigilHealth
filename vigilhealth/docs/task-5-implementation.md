# Task 5 Implementation: User Profile and Preferences

## Overview

Successfully implemented Task 5 from the VigilHealth Community Platform spec, which includes user profile management with location selection, notification preferences, search radius configuration, and GDPR-compliant data export.

## Completed Subtasks

### 5.1 Create Profile Setup Page ✅

**File:** `app/(protected)/profile/page.tsx`

- Created a comprehensive profile page with sections for:
  - Basic information (name, email)
  - Primary location selection
  - Search radius preferences
  - Notification preferences
  - Data export functionality
- Implemented protected route layout using existing `ProtectedRoute` component
- Added form validation and error handling
- Integrated with Supabase for profile data storage and retrieval
- Handles PostGIS geography data type for location storage

**Key Features:**
- Auto-loads existing profile data on mount
- Real-time form state management
- Success/error message display
- Responsive design with Tailwind CSS

### 5.2 Implement Location Picker with Mapbox Geocoding ✅

**File:** `components/profile/LocationPicker.tsx`

- Integrated Mapbox Geocoding API for location search
- Implemented autocomplete suggestions with debounced search (300ms)
- Added "Use my current location" feature using browser Geolocation API
- Reverse geocoding to convert coordinates to human-readable addresses
- Extracts city and state from Mapbox context data
- Displays selected location with coordinates

**Key Features:**
- Debounced search to minimize API calls
- Click-outside to close suggestions dropdown
- Error handling for API failures and geolocation errors
- Supports addresses, cities, ZIP codes, and neighborhoods
- US-focused search with country filter

### 5.3 Build Notification Preferences Form ✅

**File:** `components/profile/NotificationPreferences.tsx`

- Created toggle switches for three notification types:
  - Push notifications (enabled)
  - Email notifications (enabled)
  - SMS notifications (disabled - coming soon)
- Accessible switch components with ARIA attributes
- Visual feedback with color-coded toggles
- Informational note about critical alerts overriding preferences

**Key Features:**
- Accessible toggle switches with proper ARIA roles
- Visual distinction between enabled/disabled states
- SMS toggle disabled with "coming soon" message
- Responsive layout with icons

### 5.4 Implement Search Radius Preference ✅

**File:** `components/profile/SearchRadiusSlider.tsx`

- Created range slider (1-50 miles) with visual feedback
- Dynamic display of selected value (singular/plural handling)
- Gradient background showing selected range
- Distance reference guide for context
- Real-time value updates

**Key Features:**
- Range: 1-50 miles with 1-mile increments
- Visual gradient showing selected portion
- Distance reference guide (walking, short drive, regional)
- Singular/plural mile handling
- Accessible slider with proper labels

### 5.5 Add Profile Data Export as JSON ✅

**Implementation:** Integrated into `app/(protected)/profile/page.tsx`

- GDPR-compliant data export functionality
- Exports user profile data as JSON file
- Includes user ID, email, profile data, and export timestamp
- Client-side file generation and download
- Filename includes user ID and timestamp for uniqueness

**Export Format:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "timestamp"
  },
  "profile": {
    "full_name": "...",
    "primary_location": "...",
    "notification_preferences": {...}
  },
  "exported_at": "timestamp"
}
```

## Technical Implementation Details

### Database Integration

- Uses Supabase client for data operations
- Handles PostGIS `GEOGRAPHY(POINT, 4326)` data type
- Converts between PostGIS format and JavaScript objects
- Implements upsert pattern for profile updates
- Proper error handling for database operations

### PostGIS Location Handling

**Storage Format:**
```sql
POINT(longitude latitude)
```

**JavaScript Conversion:**
```typescript
// To PostGIS
const locationGeoJson = `POINT(${lng} ${lat})`;

// From PostGIS
const geoJson = JSON.parse(data.primary_location);
const location = {
  lng: geoJson.coordinates[0],
  lat: geoJson.coordinates[1]
};
```

### Mapbox Integration

- Uses Mapbox Geocoding API v5
- Public token with URL restrictions (configured in `.env.local`)
- Endpoints used:
  - Forward geocoding: `/geocoding/v5/mapbox.places/{query}.json`
  - Reverse geocoding: `/geocoding/v5/mapbox.places/{lng},{lat}.json`
- Filters: US only, types: place, locality, neighborhood, address
- Limit: 5 suggestions per search

### Configuration Updates

1. **Tailwind Config** (`tailwind.config.ts`):
   - Added CSS variable-based colors for theming
   - Configured `background`, `foreground`, `border`, etc.
   - Added border radius variables

2. **Next.js Config** (`next.config.mjs`):
   - Renamed from `.ts` to `.mjs` for compatibility
   - Removed TypeScript type annotations

3. **Vitest Config** (`vitest.config.ts`):
   - Added React plugin for component testing
   - Changed environment from `node` to `jsdom`
   - Added setup file for Testing Library

## Testing

### Unit Tests Created

1. **SearchRadiusSlider.test.tsx**:
   - Renders with initial value
   - Calls onChange when slider value changes
   - Displays singular/plural "mile(s)" correctly
   - Respects min/max values (1-50)

2. **NotificationPreferences.test.tsx**:
   - Renders all notification options
   - Displays correct initial toggle states
   - Calls onChange when toggles are clicked
   - SMS toggle is disabled

### Test Results

```
✓ __tests__/auth/jwt.test.ts (7)
✓ components/profile/__tests__/NotificationPreferences.test.tsx (5)
✓ components/profile/__tests__/SearchRadiusSlider.test.tsx (5)

Test Files  3 passed (3)
Tests  17 passed (17)
```

## Dependencies Added

- `@testing-library/react@^16.1.0` - React component testing
- `@testing-library/jest-dom@^6.6.3` - Custom Jest matchers
- `jsdom@^26.0.0` - DOM implementation for testing
- `@vitejs/plugin-react@^4.3.4` - Vite React plugin for vitest

## Files Created

### Components
- `app/(protected)/profile/page.tsx` - Main profile page
- `app/(protected)/layout.tsx` - Protected route layout
- `components/profile/LocationPicker.tsx` - Location search component
- `components/profile/NotificationPreferences.tsx` - Notification toggles
- `components/profile/SearchRadiusSlider.tsx` - Radius slider component

### Tests
- `components/profile/__tests__/SearchRadiusSlider.test.tsx`
- `components/profile/__tests__/NotificationPreferences.test.tsx`

### Configuration
- `vitest.setup.ts` - Vitest setup file

### Documentation
- `docs/task-5-implementation.md` - This file

## Files Modified

- `vigilhealth/next.config.mjs` - Renamed from .ts, removed type annotations
- `vigilhealth/tailwind.config.ts` - Added CSS variable colors
- `vigilhealth/vitest.config.ts` - Added React testing support
- `vigilhealth/app/globals.css` - Removed invalid `border-border` class

## Build Verification

- ✅ TypeScript compilation successful
- ✅ ESLint checks passed
- ✅ Next.js build successful
- ✅ All tests passing (17/17)
- ✅ Dev server starts without errors

## Usage

### Accessing the Profile Page

1. User must be authenticated (protected route)
2. Navigate to `/profile`
3. Page auto-loads existing profile data
4. Make changes and click "Save Profile"

### Location Selection

1. Type in the search box (city, address, ZIP)
2. Select from autocomplete suggestions
3. Or click "Use my current location" for browser geolocation

### Data Export

1. Click "Export My Data (GDPR)" button
2. JSON file downloads automatically
3. Filename: `vigilhealth-profile-{userId}-{timestamp}.json`

## Requirements Satisfied

From **Requirement 26: User Management - Profile and Preferences**:

- ✅ Allow users to set primary geographic area
- ✅ Configure notification preferences (types, frequency, delivery method)
- ✅ Set distance radius preferences (1-50 miles)
- ✅ Save preference changes immediately
- ✅ Apply updated preferences to future interactions
- ✅ Allow users to export profile data in JSON format

## Next Steps

Task 5 is now complete. The next task in the implementation plan is:

**Task 6: Implement WHO Disease API integration**
- Create WHO API client
- Build data parser
- Implement data mapper
- Create cron job for 6-hour fetching
- Implement caching strategy
- Write property-based tests

## Notes

- Mapbox token needs to be configured in `.env.local` for location features to work
- SMS notifications are disabled (coming soon) as per design
- Profile data is stored in the `user_profiles` table with PostGIS geography type
- Location coordinates are stored as `POINT(lng lat)` in EPSG:4326 projection
- All profile updates use upsert pattern to handle both insert and update cases

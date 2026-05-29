'use client';

import { useEffect, useState } from 'react';

import { LocationPicker } from '@/components/profile/LocationPicker';
import { NotificationPreferences } from '@/components/profile/NotificationPreferences';
import { SearchRadiusSlider } from '@/components/profile/SearchRadiusSlider';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  full_name: string;
  primary_location: { lat: number; lng: number } | null;
  primary_city: string;
  primary_state: string;
  search_radius_miles: number;
  notification_preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    primary_location: null,
    primary_city: '',
    primary_state: '',
    search_radius_miles: 5,
    notification_preferences: {
      push: true,
      email: true,
      sms: false,
    },
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // Parse PostGIS geography point if it exists
        let location = null;
        if (data.primary_location) {
          // PostGIS returns geography as GeoJSON
          const geoJson =
            typeof data.primary_location === 'string'
              ? JSON.parse(data.primary_location)
              : data.primary_location;
          if (geoJson.coordinates) {
            location = {
              lng: geoJson.coordinates[0],
              lat: geoJson.coordinates[1],
            };
          }
        }

        setProfile({
          full_name: data.full_name || '',
          primary_location: location,
          primary_city: data.primary_city || '',
          primary_state: data.primary_state || '',
          search_radius_miles: data.search_radius_miles || 5,
          notification_preferences:
            (data.notification_preferences as {
              push: boolean;
              email: boolean;
              sms: boolean;
            }) || profile.notification_preferences,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Convert location to PostGIS format
      const locationGeoJson = profile.primary_location
        ? `POINT(${profile.primary_location.lng} ${profile.primary_location.lat})`
        : null;

      const { error } = await supabase.from('user_profiles').upsert(
        {
          id: user!.id,
          full_name: profile.full_name,
          primary_location: locationGeoJson,
          primary_city: profile.primary_city,
          primary_state: profile.primary_state,
          search_radius_miles: profile.search_radius_miles,
          notification_preferences: profile.notification_preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Profile saved successfully!',
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      setMessage({
        type: 'error',
        text: `Failed to save profile: ${errMsg}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;

      // Include user email from auth
      const exportData = {
        user: {
          id: user!.id,
          email: user!.email,
          created_at: user!.created_at,
        },
        profile: data,
        exported_at: new Date().toISOString(),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vigilhealth-profile-${user!.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Profile data exported successfully!',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to export data. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your personal information and preferences
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Information */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed here
              </p>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Primary Location
          </h2>
          <LocationPicker
            location={profile.primary_location}
            city={profile.primary_city}
            state={profile.primary_state}
            onLocationChange={(location, city, state) =>
              setProfile({
                ...profile,
                primary_location: location,
                primary_city: city,
                primary_state: state,
              })
            }
          />
        </div>

        {/* Search Radius */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Search Radius
          </h2>
          <SearchRadiusSlider
            value={profile.search_radius_miles}
            onChange={(value) =>
              setProfile({ ...profile, search_radius_miles: value })
            }
          />
        </div>

        {/* Notification Preferences */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <NotificationPreferences
            preferences={profile.notification_preferences}
            onChange={(preferences) =>
              setProfile({ ...profile, notification_preferences: preferences })
            }
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between rounded-lg bg-white p-6 shadow">
          <button
            type="button"
            onClick={handleExportData}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Export My Data (GDPR)
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

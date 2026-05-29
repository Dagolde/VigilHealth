'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';

interface NotificationPrefs {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({ push: true, email: true, sms: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_preferences) {
          setPrefs(data.notification_preferences as unknown as NotificationPrefs);
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifPrefs = prefs as any;
    await supabase
      .from('user_profiles')
      .upsert({ id: user.id, notification_preferences: notifPrefs }, { onConflict: 'id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Alert System</h1>
          <p className="mt-1 text-gray-600">
            Manage your notification preferences for health alerts and daily digests.
          </p>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>

          {[
            { key: 'push' as const, label: 'Push Notifications', desc: 'Receive alerts in your browser or on your device' },
            { key: 'email' as const, label: 'Email Alerts', desc: 'Get daily digests and critical alerts by email' },
            { key: 'sms' as const, label: 'SMS Alerts', desc: 'Receive critical alerts via text message' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                checked={prefs[key]}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                type="checkbox"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </label>
          ))}

          <button
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
            onClick={handleSave}
            type="button"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Preferences'}
          </button>
        </div>

        {/* Alert Info */}
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1">📬 Daily Digest</h3>
            <p className="text-sm text-gray-600">
              Delivered every morning at 7 AM with risk level changes, new outbreaks, and supply updates for your area.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1">🚨 Critical Alerts</h3>
            <p className="text-sm text-gray-600">
              Sent immediately when risk levels reach high or critical in your area. Critical alerts bypass the 3/day limit.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1">📍 Location-Based</h3>
            <p className="text-sm text-gray-600">
              All alerts are based on your primary location. Update it in your{' '}
              <a className="text-blue-600 hover:underline" href="/profile">profile settings</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

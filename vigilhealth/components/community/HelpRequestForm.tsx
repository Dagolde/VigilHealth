'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskType = 'groceries' | 'pharmacy' | 'other';
type Urgency = 'low' | 'medium' | 'high';

interface HelpRequestFormData {
  description: string;
  taskType: TaskType;
  urgency: Urgency;
  lat: string;
  lng: string;
}

interface HelpRequestFormProps {
  onSuccess?: (requestId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HelpRequestForm({ onSuccess }: HelpRequestFormProps) {
  const [form, setForm] = useState<HelpRequestFormData>({
    description: '',
    taskType: 'other',
    urgency: 'medium',
    lat: '',
    lng: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.description.trim()) {
      setError('Please describe what you need help with.');
      return;
    }

    if (!form.lat || !form.lng) {
      setError('Please provide your location coordinates.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to submit a help request.');
        return;
      }

      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);

      const { data, error: insertError } = await supabase
        .from('help_requests')
        .insert({
          requester_id: user.id,
          description: form.description.trim(),
          task_type: form.taskType,
          urgency: form.urgency,
          location: `POINT(${lng} ${lat})`,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        setError('Failed to submit help request. Please try again.');
        return;
      }

      setSuccess(true);
      onSuccess?.(data.id);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        }));
      },
      () => setError('Could not detect your location.')
    );
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center border border-green-200">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800">Help Request Submitted!</h3>
        <p className="text-green-700 mt-1">Nearby volunteers will be notified.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What do you need help with? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder="Describe your request..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
          <select
            value={form.taskType}
            onChange={(e) => setForm((prev) => ({ ...prev, taskType: e.target.value as TaskType }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="groceries">Groceries</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
          <select
            value={form.urgency}
            onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value as Urgency }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Location</label>
        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={form.lat}
            onChange={(e) => setForm((prev) => ({ ...prev, lat: e.target.value }))}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={form.lng}
            onChange={(e) => setForm((prev) => ({ ...prev, lng: e.target.value }))}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={detectLocation}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            📍 Detect
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Help Request'}
      </button>
    </form>
  );
}

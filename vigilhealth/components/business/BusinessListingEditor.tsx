'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessListingData {
  name: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  specialOffer: string;
  photoUrl: string;
}

interface BusinessListingEditorProps {
  locationId?: string;
  initialData?: Partial<BusinessListingData>;
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BusinessListingEditor({
  locationId,
  initialData,
  onSuccess,
}: BusinessListingEditorProps) {
  const [form, setForm] = useState<BusinessListingData>({
    name: initialData?.name ?? '',
    address: initialData?.address ?? '',
    phone: initialData?.phone ?? '',
    hours: initialData?.hours ?? '',
    description: initialData?.description ?? '',
    specialOffer: initialData?.specialOffer ?? '',
    photoUrl: initialData?.photoUrl ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.address.trim()) {
      setError('Business name and address are required.');
      return;
    }

    setSubmitting(true);

    try {
      if (locationId) {
        // Update existing location
        const { error: updateError } = await supabase
          .from('supply_locations')
          .update({
            name: form.name.trim(),
            address: form.address.trim(),
            phone: form.phone.trim() || null,
            hours: form.hours.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', locationId);

        if (updateError) {
          setError('Failed to update listing.');
          return;
        }
      } else {
        // Create new location (requires lat/lng in production)
        const { error: insertError } = await supabase.from('supply_locations').insert({
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim() || null,
          hours: form.hours.trim() || null,
          location: 'POINT(0 0)', // Placeholder — set real coords in production
          is_premium: true,
          has_safe_badge: false,
        });

        if (insertError) {
          setError('Failed to create listing.');
          return;
        }
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-center border border-green-200">
        <p className="text-green-800 font-medium">Listing saved successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
          <input
            type="text"
            value={form.hours}
            onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))}
            placeholder="e.g. Mon-Fri 9am-5pm"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Premium)
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={3}
          placeholder="Describe your services..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Offer (Premium)
        </label>
        <input
          type="text"
          value={form.specialOffer}
          onChange={(e) => setForm((p) => ({ ...p, specialOffer: e.target.value }))}
          placeholder="e.g. Free flu shot with insurance"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photo URL (Premium)
        </label>
        <input
          type="url"
          value={form.photoUrl}
          onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))}
          placeholder="https://..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {form.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.photoUrl}
            alt="Preview"
            className="mt-2 h-24 w-full object-cover rounded-md border border-gray-200"
          />
        )}
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
        {submitting ? 'Saving...' : 'Save Listing'}
      </button>
    </form>
  );
}

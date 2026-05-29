'use client';

import { VolunteerRegistration } from '@/components/community/VolunteerRegistration';

export default function VolunteersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Become a Volunteer</h1>
          <p className="mt-1 text-gray-600">
            Register as a verified volunteer to help neighbors during health crises.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <VolunteerRegistration />
        </div>

        <div className="mt-4 rounded-lg bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-800">
            <strong>Verification required:</strong> All volunteers must verify their email and phone number.
            Verified volunteers receive a badge visible to help requesters.
          </p>
        </div>
      </div>
    </div>
  );
}

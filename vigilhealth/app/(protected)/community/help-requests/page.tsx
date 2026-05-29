'use client';

import { HelpRequestForm } from '@/components/community/HelpRequestForm';
import { HelpRequestList } from '@/components/community/HelpRequestList';

export default function HelpRequestsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Help Requests</h1>
          <p className="mt-1 text-gray-600">
            Request help from verified neighbors or volunteer to assist those in need.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Help</h2>
            <HelpRequestForm />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nearby Requests</h2>
            <HelpRequestList />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { SymptomCheckerFlow } from '@/components/symptom-checker/SymptomCheckerFlow';

export default function SymptomCheckerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Symptom Checker</h1>
          <p className="mt-1 text-gray-600">
            Match your symptoms against current outbreak profiles and get guidance on next steps.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <SymptomCheckerFlow />
        </div>

        <div className="mt-4 rounded-lg bg-amber-50 p-4 border border-amber-200">
          <p className="text-xs text-amber-800">
            <strong>Medical Disclaimer:</strong> This tool provides general health information only.
            It is not a substitute for professional medical advice, diagnosis, or treatment.
            If you are experiencing a medical emergency, call 911 immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

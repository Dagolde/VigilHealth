'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'mild' | 'moderate' | 'severe';

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Sore throat', 'Runny nose', 'Headache',
  'Fatigue', 'Body aches', 'Shortness of breath', 'Nausea', 'Diarrhea',
  'Loss of taste/smell', 'Chills', 'Vomiting',
];

interface EmployeeSymptomFormProps {
  organizationId: string;
  locationId?: string;
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmployeeSymptomForm({
  organizationId,
  locationId,
  onSuccess,
}: EmployeeSymptomFormProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>('mild');
  const [isAbsent, setIsAbsent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consentGiven) {
      setError('You must provide consent before submitting health data.');
      return;
    }

    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in.');
        return;
      }

      // Use a hashed/anonymous employee ID for privacy
      const employeeId = `emp_${user.id.slice(0, 8)}`;

      const { error: insertError } = await supabase
        .from('employee_wellness_reports')
        .insert({
          organization_id: organizationId,
          location_id: locationId ?? null,
          employee_id: employeeId,
          symptoms: selectedSymptoms,
          severity,
          is_absent: isAbsent,
          reported_at: new Date().toISOString(),
        });

      if (insertError) {
        setError('Failed to submit report. Please try again.');
        return;
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
      <div className="rounded-lg bg-green-50 p-6 text-center border border-green-200">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800">Report Submitted</h3>
        <p className="text-green-700 mt-1">Thank you for keeping your workplace safe.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Consent */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-blue-800">
            <strong>Consent Required:</strong> I consent to my anonymized health data being
            collected and used for workplace wellness monitoring. My data will be stored securely
            and only shared in aggregate form with my employer.
          </span>
        </label>
      </div>

      {/* Symptoms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Symptoms <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              onClick={() => toggleSymptom(symptom)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedSymptoms.includes(symptom)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
        <div className="flex gap-3">
          {(['mild', 'moderate', 'severe'] as Severity[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors capitalize ${
                severity === s
                  ? s === 'severe'
                    ? 'bg-red-600 text-white'
                    : s === 'moderate'
                      ? 'bg-amber-500 text-white'
                      : 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Absence */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isAbsent}
          onChange={(e) => setIsAbsent(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">I am absent from work today</span>
      </label>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !consentGiven}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Wellness Report'}
      </button>
    </form>
  );
}

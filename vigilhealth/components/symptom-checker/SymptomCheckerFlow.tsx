'use client';

import { useState } from 'react';

import { TelehealthProviderList } from '@/components/telehealth/TelehealthProviderList';
import {
  EMERGENCY_SYMPTOMS,
  runSymptomCheck,
  type SymptomCheckResult,
  type SymptomMatch,
} from '@/lib/symptom-checker/outbreak-profiles';

import { isDisclaimerAcknowledged, MedicalDisclaimer } from './MedicalDisclaimer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SymptomCheckerFlowProps {
  onComplete?: (result: SymptomCheckResult) => void;
  className?: string;
}

type Severity = 'mild' | 'moderate' | 'severe';
type Step = 'disclaimer' | 'symptoms' | 'duration' | 'results';

// ─── Symptom list ─────────────────────────────────────────────────────────────

interface SymptomOption {
  id: string;
  label: string;
}

const SYMPTOM_OPTIONS: SymptomOption[] = [
  { id: 'fever', label: 'Fever' },
  { id: 'cough', label: 'Cough' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'shortness_of_breath', label: 'Shortness of Breath' },
  { id: 'chest_pain', label: 'Chest Pain' },
  { id: 'headache', label: 'Headache' },
  { id: 'sore_throat', label: 'Sore Throat' },
  { id: 'runny_nose', label: 'Runny Nose' },
  { id: 'body_aches', label: 'Body Aches' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'diarrhea', label: 'Diarrhea' },
  { id: 'loss_of_taste_or_smell', label: 'Loss of Taste or Smell' },
  { id: 'rash', label: 'Rash' },
  { id: 'chills', label: 'Chills' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasEmergencySymptom(selected: Set<string>): boolean {
  return EMERGENCY_SYMPTOMS.some((s) => selected.has(s));
}

function recommendationLabel(rec: SymptomMatch['recommendation']): string {
  switch (rec) {
    case 'monitor':
      return 'Monitor at home';
    case 'telehealth':
      return 'Consider telehealth visit';
    case 'testing':
      return 'Seek testing / in-person care';
    case 'emergency':
      return 'Seek emergency care immediately';
  }
}

function recommendationColor(rec: SymptomMatch['recommendation']): string {
  switch (rec) {
    case 'monitor':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'telehealth':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'testing':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'emergency':
      return 'text-red-700 bg-red-50 border-red-200';
  }
}

function confidenceColor(confidence: number): string {
  if (confidence >= 70) return 'bg-red-500';
  if (confidence >= 40) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function generateSymptomSummary(result: SymptomCheckResult): string {
  const topMatches = result.matches.slice(0, 3);
  const matchDescriptions = topMatches
    .map((m) => `${m.disease} (${m.confidence}% confidence)`)
    .join(', ');

  return `Symptom check results: ${matchDescriptions || 'No strong matches'}. ${
    result.hasEmergency ? 'Emergency symptoms detected.' : ''
  }`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmergencyBanner() {
  return (
    <div
      className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-red-800">Emergency Symptoms Detected</p>
          <p className="mt-1 text-sm text-red-700">
            You have selected symptoms that may require immediate medical attention.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="tel:911"
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              📞 Call 911
            </a>
            <a
              href="tel:988"
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              988 Suicide &amp; Crisis Lifeline
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Symptom Selection ────────────────────────────────────────────────

interface Step1Props {
  selected: Set<string>;
  otherText: string;
  onToggle: (id: string) => void;
  onOtherChange: (text: string) => void;
  onNext: () => void;
}

function SymptomSelectionStep({ selected, otherText, onToggle, onOtherChange, onNext }: Step1Props) {
  const showEmergency = hasEmergencySymptom(selected);
  const canProceed = selected.size > 0 || otherText.trim().length > 0;

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-gray-900">Step 1 of 2 — Select Symptoms</h2>
      <p className="mb-4 text-sm text-gray-600">Select all symptoms you are currently experiencing.</p>

      {showEmergency && <EmergencyBanner />}

      <fieldset>
        <legend className="sr-only">Symptoms</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SYMPTOM_OPTIONS.map((symptom) => {
            const isChecked = selected.has(symptom.id);
            const isEmergency = EMERGENCY_SYMPTOMS.includes(symptom.id);
            return (
              <label
                key={symptom.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  isChecked
                    ? isEmergency
                      ? 'border-red-400 bg-red-50 text-red-800'
                      : 'border-blue-400 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={isChecked}
                  onChange={() => onToggle(symptom.id)}
                  aria-label={symptom.label}
                />
                <span className="font-medium">{symptom.label}</span>
                {isEmergency && (
                  <span className="ml-auto text-xs font-semibold text-red-600" aria-label="emergency symptom">
                    ⚠
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Other symptoms */}
      <div className="mt-4">
        <label htmlFor="other-symptoms" className="block text-sm font-medium text-gray-700">
          Other symptoms (optional)
        </label>
        <input
          id="other-symptoms"
          type="text"
          maxLength={100}
          value={otherText}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Describe any other symptoms..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">{otherText.length}/100 characters</p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next: Duration &amp; Severity →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Duration & Severity ─────────────────────────────────────────────

interface Step2Props {
  duration: number | '';
  severity: Severity | '';
  onDurationChange: (val: number | '') => void;
  onSeverityChange: (val: Severity) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function DurationSeverityStep({
  duration,
  severity,
  onDurationChange,
  onSeverityChange,
  onBack,
  onSubmit,
}: Step2Props) {
  const canSubmit = duration !== '' && duration >= 1 && duration <= 30 && severity !== '';

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-gray-900">Step 2 of 2 — Duration &amp; Severity</h2>
      <p className="mb-6 text-sm text-gray-600">Tell us how long you have had these symptoms and how severe they are.</p>

      {/* Duration */}
      <div className="mb-6">
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
          How many days have you had these symptoms?
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="duration"
            type="number"
            min={1}
            max={30}
            value={duration}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              onDurationChange(val);
            }}
            placeholder="e.g. 3"
            className="block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            aria-describedby="duration-hint"
          />
          <span className="text-sm text-gray-500">days (1–30)</span>
        </div>
        <p id="duration-hint" className="mt-1 text-xs text-gray-500">
          Enter a number between 1 and 30.
        </p>
      </div>

      {/* Severity */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            How severe are your symptoms overall?
          </legend>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
            {(['mild', 'moderate', 'severe'] as Severity[]).map((level) => (
              <label
                key={level}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  severity === level
                    ? level === 'severe'
                      ? 'border-red-400 bg-red-50 text-red-800'
                      : level === 'moderate'
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value={level}
                  checked={severity === level}
                  onChange={() => onSeverityChange(level)}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium capitalize">{level}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Check Symptoms
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Results ──────────────────────────────────────────────────────────

interface Step3Props {
  result: SymptomCheckResult;
  onReset: () => void;
}

function ResultsStep({ result, onReset }: Step3Props) {
  const showTelehealth = result.matches.some(
    (m) => m.confidence > 70 && m.recommendation !== 'emergency'
  );

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-gray-900">Your Results</h2>
      <p className="mb-4 text-sm text-gray-600">
        Based on your symptoms, here are the most likely conditions.
      </p>

      {/* Emergency banner */}
      {result.hasEmergency && <EmergencyBanner />}

      {/* No matches */}
      {result.matches.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-gray-600">
            No strong matches found. Monitor your symptoms and consult a healthcare provider if they
            worsen.
          </p>
        </div>
      )}

      {/* Match cards */}
      {result.matches.length > 0 && (
        <div className="space-y-3">
          {result.matches.map((match) => (
            <div
              key={match.disease}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{match.disease}</h3>
                  {match.commonSymptoms.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Matched: {match.commonSymptoms.join(', ').replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-2xl font-bold text-gray-900">{match.confidence}%</span>
                  <p className="text-xs text-gray-500">confidence</p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${confidenceColor(match.confidence)}`}
                  style={{ width: `${match.confidence}%` }}
                  role="progressbar"
                  aria-valuenow={match.confidence}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${match.confidence}% confidence`}
                />
              </div>

              {/* Recommendation */}
              <div
                className={`mt-3 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${recommendationColor(match.recommendation)}`}
              >
                {recommendationLabel(match.recommendation)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Telehealth CTA */}
      {showTelehealth && (
        <div className="mt-6">
          <TelehealthProviderList
            symptomSummary={generateSymptomSummary(result)}
            onBookingComplete={(_data) => {
              // Booking completed successfully
              // Could show a success message or update UI
            }}
          />
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="text-xs leading-relaxed text-gray-500">
          <strong>Medical Disclaimer:</strong> This tool provides general health information only
          and is not a substitute for professional medical advice, diagnosis, or treatment. Always
          seek the advice of your physician or other qualified health provider with any questions you
          may have regarding a medical condition.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SymptomCheckerFlow({ onComplete, className = '' }: SymptomCheckerFlowProps) {
  // Determine initial step based on session storage
  const [step, setStep] = useState<Step>(() =>
    isDisclaimerAcknowledged() ? 'symptoms' : 'disclaimer'
  );

  // Step 1 state
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [otherSymptoms, setOtherSymptoms] = useState('');

  // Step 2 state
  const [duration, setDuration] = useState<number | ''>('');
  const [severity, setSeverity] = useState<Severity | ''>('');

  // Step 3 state
  const [result, setResult] = useState<SymptomCheckResult | null>(null);

  const handleToggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (duration === '' || severity === '') return;

    const allSymptoms = Array.from(selectedSymptoms);
    const checkResult = runSymptomCheck(allSymptoms, duration, severity);
    setResult(checkResult);
    setStep('results');
    onComplete?.(checkResult);
  };

  const handleReset = () => {
    setSelectedSymptoms(new Set());
    setOtherSymptoms('');
    setDuration('');
    setSeverity('');
    setResult(null);
    setStep('symptoms');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Disclaimer modal */}
      {step === 'disclaimer' && (
        <MedicalDisclaimer
          onAcknowledge={() => setStep('symptoms')}
          onCancel={() => {
            // Navigate away or close — here we just show a message
            // In a real app this would use router.back() or similar
            window.history.back();
          }}
        />
      )}

      {/* Main card */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        {/* Progress indicator */}
        {(step === 'symptoms' || step === 'duration' || step === 'results') && (
          <div className="mb-6">
            <div className="flex items-center gap-2">
              {['symptoms', 'duration', 'results'].map((s, i) => {
                const stepIndex = ['symptoms', 'duration', 'results'].indexOf(step);
                const isActive = s === step;
                const isComplete = i < stepIndex;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isComplete
                          ? 'bg-blue-600 text-white'
                          : isActive
                            ? 'border-2 border-blue-600 text-blue-600'
                            : 'border-2 border-gray-200 text-gray-400'
                      }`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isComplete ? '✓' : i + 1}
                    </div>
                    {i < 2 && (
                      <div
                        className={`h-0.5 w-8 ${isComplete ? 'bg-blue-600' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step content */}
        {step === 'symptoms' && (
          <SymptomSelectionStep
            selected={selectedSymptoms}
            otherText={otherSymptoms}
            onToggle={handleToggleSymptom}
            onOtherChange={setOtherSymptoms}
            onNext={() => setStep('duration')}
          />
        )}

        {step === 'duration' && (
          <DurationSeverityStep
            duration={duration}
            severity={severity}
            onDurationChange={setDuration}
            onSeverityChange={setSeverity}
            onBack={() => setStep('symptoms')}
            onSubmit={handleSubmit}
          />
        )}

        {step === 'results' && result && (
          <ResultsStep result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

import { TRUSTED_ORGANIZATIONS, validateSourceUrl } from '@/lib/qa/source-validator';
import { createClient } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceEntry {
  url: string;
  title: string;
  organization: string;
}

interface AnswerFormProps {
  questionId: string;
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnswerForm({ questionId, onSuccess }: AnswerFormProps) {
  const [body, setBody] = useState('');
  const [sources, setSources] = useState<SourceEntry[]>([{ url: '', title: '', organization: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const addSource = () => {
    setSources((prev) => [...prev, { url: '', title: '', organization: '' }]);
  };

  const removeSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, field: keyof SourceEntry, value: string) => {
    setSources((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim() || body.trim().length < 20) {
      setError('Answer must be at least 20 characters.');
      return;
    }

    // Validate sources
    const validSources = sources.filter((s) => s.url.trim());
    if (validSources.length === 0) {
      setError('At least one verified source citation is required.');
      return;
    }

    for (const source of validSources) {
      const result = validateSourceUrl(source.url);
      if (!result.isValid) {
        setError(result.reason ?? 'Invalid source URL.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit an answer.');
        return;
      }

      const { error: insertError } = await supabase.from('answers').insert({
        question_id: questionId,
        user_id: user.id,
        body: body.trim(),
        sources: validSources as unknown as Json,
        is_verified: false,
        upvotes: 0,
        is_flagged: false,
        flag_count: 0,
      });

      if (insertError) {
        setError('Failed to submit answer. Please try again.');
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
      <div className="rounded-lg bg-green-50 p-4 text-center border border-green-200">
        <p className="text-green-800 font-medium">Answer submitted successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Provide a detailed, evidence-based answer..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Sources */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Sources <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addSource}
            className="text-xs text-blue-600 hover:underline"
          >
            + Add source
          </button>
        </div>

        <div className="rounded-md bg-blue-50 p-3 mb-3 border border-blue-200">
          <p className="text-xs text-blue-800">
            Sources must be from trusted organizations: {TRUSTED_ORGANIZATIONS.slice(0, 5).join(', ')}, and others.
          </p>
        </div>

        <div className="space-y-3">
          {sources.map((source, index) => (
            <div key={index} className="rounded-md border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Source {index + 1}</span>
                {sources.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSource(index)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="url"
                value={source.url}
                onChange={(e) => updateSource(index, 'url', e.target.value)}
                placeholder="https://www.who.int/..."
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={source.title}
                onChange={(e) => updateSource(index, 'title', e.target.value)}
                placeholder="Article title (optional)"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={source.organization}
                onChange={(e) => updateSource(index, 'organization', e.target.value)}
                placeholder="Organization (e.g. WHO)"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
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
        {submitting ? 'Submitting...' : 'Submit Answer'}
      </button>
    </form>
  );
}

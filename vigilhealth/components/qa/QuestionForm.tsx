'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { Question } from '@/lib/supabase/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEALTH_KEYWORDS = [
  'symptom', 'disease', 'virus', 'bacteria', 'infection', 'vaccine', 'medication',
  'treatment', 'health', 'medical', 'doctor', 'hospital', 'clinic', 'pharmacy',
  'outbreak', 'pandemic', 'epidemic', 'flu', 'covid', 'fever', 'pain', 'cough',
  'prevention', 'diagnosis', 'therapy', 'drug', 'pill', 'dose', 'immune',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHealthRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return HEALTH_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QuestionFormProps {
  onSuccess?: (questionId: string) => void;
}

export function QuestionForm({ onSuccess }: QuestionFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [similarQuestions, setSimilarQuestions] = useState<Question[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  // Duplicate detection: search for similar questions as user types
  useEffect(() => {
    if (title.length < 10) {
      setSimilarQuestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const words = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      if (words.length === 0) return;

      const { data } = await supabase
        .from('questions')
        .select('id, title, body, created_at, user_id, tags, view_count, updated_at')
        .ilike('title', `%${words[0]}%`)
        .limit(3);

      setSimilarQuestions(data ?? []);
      setShowSimilar((data?.length ?? 0) > 0);
    }, 500);

    return () => clearTimeout(timer);
  }, [title, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    if (!title.trim() || title.trim().length < 10) {
      setError('Question title must be at least 10 characters.');
      return;
    }

    if (!body.trim() || body.trim().length < 20) {
      setError('Question body must be at least 20 characters.');
      return;
    }

    // Health topic validation
    if (!isHealthRelated(title + ' ' + body)) {
      setWarning(
        'This question does not appear to be health-related. VigilHealth Q&A is for health topics only.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to ask a question.');
        return;
      }

      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const { data, error: insertError } = await supabase
        .from('questions')
        .insert({
          user_id: user.id,
          title: title.trim(),
          body: body.trim(),
          tags: tagArray.length > 0 ? tagArray : null,
        })
        .select('id')
        .single();

      if (insertError) {
        setError('Failed to submit question. Please try again.');
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

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center border border-green-200">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800">Question Submitted!</h3>
        <p className="text-green-700 mt-1">Your question is now visible to the community.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is your health question?"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Similar Questions */}
      {showSimilar && similarQuestions.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Similar questions already exist:
          </p>
          <ul className="space-y-1">
            {similarQuestions.map((q) => (
              <li key={q.id}>
                <a
                  href={`/qa/${q.id}`}
                  className="text-sm text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {q.title}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowSimilar(false)}
            className="mt-2 text-xs text-amber-700 underline"
          >
            My question is different, continue anyway
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Details <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Provide more context about your question..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags (comma-separated, optional)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. flu, vaccine, prevention"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {warning && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          ⚠️ {warning}
        </div>
      )}

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
        {submitting ? 'Submitting...' : 'Submit Question'}
      </button>
    </form>
  );
}

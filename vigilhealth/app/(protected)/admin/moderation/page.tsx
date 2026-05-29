'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { Answer } from '@/lib/supabase/types';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ModerationQueuePage() {
  const [flaggedAnswers, setFlaggedAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data, error: queryError } = await supabase
        .from('answers')
        .select('*')
        .eq('is_flagged', true)
        .order('flag_count', { ascending: false })
        .limit(50);

      if (queryError) {
        setError('Failed to load moderation queue.');
      } else {
        setFlaggedAnswers(data ?? []);
      }
      setLoading(false);
    }

    void load();
  }, [supabase]);

  const handleModerate = async (answerId: string, action: 'approve' | 'remove') => {
    const response = await fetch(`/api/qa/answers/${answerId}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (response.ok) {
      setFlaggedAnswers((prev) => prev.filter((a) => a.id !== answerId));
    } else {
      alert('Failed to moderate answer.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
          <p className="text-gray-600 mt-1">Review flagged answers for potential misinformation.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">{error}</div>
        )}

        {!loading && !error && flaggedAnswers.length === 0 && (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 border border-gray-200">
            No flagged answers in the queue. ✅
          </div>
        )}

        <div className="space-y-4">
          {flaggedAnswers.map((answer) => (
            <div
              key={answer.id}
              className="rounded-lg bg-white p-5 shadow-sm border border-red-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      🚩 {answer.flag_count} flags
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(answer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{answer.body}</p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => void handleModerate(answer.id, 'approve')}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => void handleModerate(answer.id, 'remove')}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    ✗ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

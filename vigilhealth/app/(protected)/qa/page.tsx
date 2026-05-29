'use client';

import { useEffect, useState } from 'react';

import { AnswerForm } from '@/components/qa/AnswerForm';
import { QuestionForm } from '@/components/qa/QuestionForm';
import { createClient } from '@/lib/supabase/client';
import type { Answer, Question } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionWithAnswers extends Question {
  answers?: Answer[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QAPage() {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showAnswerForm, setShowAnswerForm] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setQuestions(data ?? []);
      setLoading(false);
    }

    void load();
  }, [supabase]);

  const loadAnswers = async (questionId: string) => {
    if (selectedQuestion === questionId) {
      setSelectedQuestion(null);
      return;
    }

    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .eq('is_flagged', false)
      .order('upvotes', { ascending: false });

    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answers: data ?? [] } : q))
    );
    setSelectedQuestion(questionId);
  };

  const handleUpvote = async (answerId: string) => {
    await fetch(`/api/qa/answers/${answerId}/upvote`, { method: 'POST' });
    // Refresh answers for the selected question
    if (selectedQuestion) {
      await loadAnswers(selectedQuestion);
    }
  };

  const handleFlag = async (answerId: string) => {
    await fetch(`/api/qa/answers/${answerId}/flag`, { method: 'POST' });
    if (selectedQuestion) {
      await loadAnswers(selectedQuestion);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Community Q&amp;A</h1>
          <p className="mt-2 text-gray-600">
            Ask health questions and get evidence-based answers from the community.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>⚠️ Medical Disclaimer:</strong> Information provided here is for educational
            purposes only and does not constitute medical advice. Always consult a qualified
            healthcare professional for medical decisions.
          </p>
        </div>

        {/* Ask Question Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Ask a Question'}
          </button>
        </div>

        {/* Question Form */}
        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ask a Question</h2>
            <QuestionForm
              onSuccess={() => {
                setShowForm(false);
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg bg-white shadow-sm border border-gray-200"
              >
                <div className="p-5">
                  <button
                    onClick={() => void loadAnswers(q.id)}
                    className="text-left w-full"
                  >
                    <h3 className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {q.title}
                    </h3>
                  </button>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{q.body}</p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {(q.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => void loadAnswers(q.id)}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedQuestion === q.id ? 'Hide answers' : 'View answers'}
                    </button>
                    <button
                      onClick={() =>
                        setShowAnswerForm(showAnswerForm === q.id ? null : q.id)
                      }
                      className="text-blue-600 hover:underline"
                    >
                      Answer
                    </button>
                  </div>
                </div>

                {/* Answers */}
                {selectedQuestion === q.id && q.answers && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    {q.answers.length === 0 ? (
                      <p className="text-sm text-gray-500">No answers yet. Be the first!</p>
                    ) : (
                      q.answers.map((a) => (
                        <div key={a.id} className="rounded-md bg-gray-50 p-4 border border-gray-200">
                          <p className="text-sm text-gray-800">{a.body}</p>

                          {Array.isArray(a.sources) && a.sources.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600">Sources:</p>
                              <ul className="mt-1 space-y-0.5">
                                {(a.sources as Array<{ url: string; title?: string; organization?: string }>).map(
                                  (src, i) => (
                                    <li key={i}>
                                      <a
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        {src.title ?? src.organization ?? src.url}
                                      </a>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => void handleUpvote(a.id)}
                              className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              ▲ {a.upvotes ?? 0}
                            </button>
                            <button
                              onClick={() => void handleFlag(a.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              🚩 Flag
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Answer Form */}
                {showAnswerForm === q.id && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <AnswerForm
                      questionId={q.id}
                      onSuccess={() => {
                        setShowAnswerForm(null);
                        void loadAnswers(q.id);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

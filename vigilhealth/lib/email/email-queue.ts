/**
 * Email Queue with Retry Logic
 *
 * Implements an in-memory email queue with exponential backoff retry.
 * For production, replace with a persistent queue (e.g., Upstash QStash).
 */

import { getResendClient } from './resend-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailJob {
  id: string;
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number; // Unix timestamp ms
  createdAt: number;
  status: 'pending' | 'sent' | 'failed';
  lastError?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@vigilhealth.app';
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1_000; // 1 second

// ─── In-memory queue (replace with persistent store in production) ─────────────

const queue: Map<string, EmailJob> = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Calculate exponential backoff delay.
 * Delay = BASE_DELAY * 2^attempt (capped at 30 minutes)
 */
function backoffDelay(attempt: number): number {
  const MAX_DELAY_MS = 30 * 60 * 1_000;
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface EnqueueEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  maxAttempts?: number;
}

/**
 * Add an email to the queue for delivery.
 * Returns the job ID.
 */
export function enqueueEmail(options: EnqueueEmailOptions): string {
  const id = generateId();
  const job: EmailJob = {
    id,
    to: options.to,
    from: options.from ?? DEFAULT_FROM,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attempts: 0,
    maxAttempts: options.maxAttempts ?? MAX_ATTEMPTS,
    nextRetryAt: Date.now(),
    createdAt: Date.now(),
    status: 'pending',
  };
  queue.set(id, job);
  return id;
}

/**
 * Process all pending jobs that are ready to send.
 * Call this from a cron job or background worker.
 */
export async function processQueue(): Promise<{ sent: number; failed: number }> {
  const now = Date.now();
  let sent = 0;
  let failed = 0;

  const resend = getResendClient();

  for (const job of queue.values()) {
    if (job.status !== 'pending') continue;
    if (job.nextRetryAt > now) continue;

    try {
      await resend.emails.send({
        from: job.from,
        to: Array.isArray(job.to) ? job.to : [job.to],
        subject: job.subject,
        html: job.html,
        text: job.text,
      });

      job.status = 'sent';
      sent++;
    } catch (error) {
      job.attempts++;
      job.lastError = error instanceof Error ? error.message : String(error);

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        failed++;
        console.error(`[EmailQueue] Job ${job.id} permanently failed after ${job.attempts} attempts`);
      } else {
        job.nextRetryAt = now + backoffDelay(job.attempts);
        console.warn(
          `[EmailQueue] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}), retry at ${new Date(job.nextRetryAt).toISOString()}`
        );
      }
    }
  }

  return { sent, failed };
}

/**
 * Get queue statistics.
 */
export function getQueueStats(): { pending: number; sent: number; failed: number; total: number } {
  let pending = 0;
  let sent = 0;
  let failed = 0;

  for (const job of queue.values()) {
    if (job.status === 'pending') pending++;
    else if (job.status === 'sent') sent++;
    else if (job.status === 'failed') failed++;
  }

  return { pending, sent, failed, total: queue.size };
}

/**
 * Get a job by ID.
 */
export function getJob(id: string): EmailJob | undefined {
  return queue.get(id);
}

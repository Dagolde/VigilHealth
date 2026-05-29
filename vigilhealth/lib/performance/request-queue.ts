/**
 * Request Queue Utility
 *
 * Implements a concurrency-limited request queue for handling traffic spikes.
 * Prevents overwhelming downstream services (Supabase, Mapbox, etc.).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type QueuedTask<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  addedAt: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONCURRENCY = 10;
const DEFAULT_TIMEOUT_MS = 30_000;

// ─── Queue ────────────────────────────────────────────────────────────────────

export class RequestQueue {
  private readonly concurrency: number;
  private readonly timeoutMs: number;
  private running = 0;
  private readonly queue: QueuedTask<unknown>[] = [];

  constructor(concurrency = DEFAULT_CONCURRENCY, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.concurrency = concurrency;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Add a task to the queue. Returns a promise that resolves when the task completes.
   */
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: QueuedTask<T> = {
        fn,
        resolve,
        reject,
        addedAt: Date.now(),
      };

      this.queue.push(task as QueuedTask<unknown>);
      this.processNext();
    });
  }

  /**
   * Get queue statistics.
   */
  getStats(): { running: number; queued: number; concurrency: number } {
    return {
      running: this.running,
      queued: this.queue.length,
      concurrency: this.concurrency,
    };
  }

  private processNext(): void {
    if (this.running >= this.concurrency || this.queue.length === 0) return;

    const task = this.queue.shift();
    if (!task) return;

    this.running++;

    // Check if task has timed out while waiting in queue
    if (Date.now() - task.addedAt > this.timeoutMs) {
      task.reject(new Error('Request timed out in queue'));
      this.running--;
      this.processNext();
      return;
    }

    const timeoutId = setTimeout(() => {
      task.reject(new Error(`Request timed out after ${this.timeoutMs}ms`));
    }, this.timeoutMs);

    task
      .fn()
      .then((result) => {
        clearTimeout(timeoutId);
        task.resolve(result);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        task.reject(error);
      })
      .finally(() => {
        this.running--;
        this.processNext();
      });
  }
}

// ─── Singleton Queues ─────────────────────────────────────────────────────────

/** Queue for Supabase database requests */
export const dbQueue = new RequestQueue(10);

/** Queue for external API requests (WHO, CDC, Mapbox) */
export const externalApiQueue = new RequestQueue(5);

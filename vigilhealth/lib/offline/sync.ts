'use client';

import {
  addToSyncQueue,
  getAllSyncQueueItems,
  removeSyncQueueItem,
  incrementSyncRetry,
  type SyncQueueItem,
} from './db';

const MAX_RETRIES = 3;

/**
 * Queue an API action for background sync when offline.
 * If online, attempts the request immediately.
 * If offline, stores in IndexedDB and registers a background sync.
 */
export async function queueOrExecute(
  url: string,
  method: SyncQueueItem['method'],
  body: unknown,
  tag: string,
  headers: Record<string, string> = {}
): Promise<Response | null> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // If online, try immediately
  if (navigator.onLine) {
    try {
      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: JSON.stringify(body),
      });
      return response;
    } catch {
      // Fall through to queue if fetch fails
    }
  }

  // Queue for background sync
  await addToSyncQueue({
    url,
    method,
    headers: defaultHeaders,
    body: JSON.stringify(body),
    tag,
  });

  // Register background sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await (
      registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      }
    ).sync.register('sync-offline-actions');
  }

  return null;
}

/**
 * Manually flush the sync queue (called when coming back online).
 * Used as a fallback when Background Sync API is not supported.
 */
export async function flushSyncQueue(): Promise<{ succeeded: number; failed: number }> {
  const items = await getAllSyncQueueItems();
  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    if (item.retryCount >= MAX_RETRIES) {
      // Give up after max retries
      await removeSyncQueueItem(item.id);
      failed++;
      continue;
    }

    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        await removeSyncQueueItem(item.id);
        succeeded++;
      } else {
        await incrementSyncRetry(item.id);
        failed++;
      }
    } catch {
      await incrementSyncRetry(item.id);
      failed++;
    }
  }

  return { succeeded, failed };
}

/**
 * Set up online/offline event listeners.
 * Call this once in a client component (e.g., root layout).
 */
export function setupOfflineSync(): () => void {
  const handleOnline = () => {
    flushSyncQueue().catch(console.error);
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

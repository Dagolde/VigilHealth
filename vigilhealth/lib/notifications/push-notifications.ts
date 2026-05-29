/**
 * Browser Push Notifications via Web Push API
 *
 * Handles VAPID key generation, subscription management,
 * and sending push notifications to subscribed browsers.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

// ─── VAPID Public Key ─────────────────────────────────────────────────────────

export function getVapidPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable is not set');
  }
  return key;
}

// ─── Subscription Management ──────────────────────────────────────────────────

/**
 * Request push notification permission and subscribe the browser.
 * Returns the PushSubscription or null if denied/unsupported.
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    // Push notifications not supported in this environment
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      // Permission denied by user
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = getVapidPublicKey();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return subscription;
  } catch (error) {
    console.error('[PushNotifications] Failed to subscribe:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true;

    return await subscription.unsubscribe();
  } catch (error) {
    console.error('[PushNotifications] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Get the current push subscription if one exists.
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Show a local browser notification (for testing without a push server).
 */
export function showLocalNotification(payload: PushNotificationPayload): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(payload.title, {
    body: payload.body,
    icon: payload.icon ?? '/icons/icon-192x192.png',
    badge: payload.badge ?? '/icons/badge-72x72.png',
    tag: payload.tag,
    requireInteraction: payload.requireInteraction ?? false,
  });

  if (payload.url) {
    notification.onclick = () => {
      window.open(payload.url, '_blank');
      notification.close();
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a URL-safe base64 VAPID key to a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

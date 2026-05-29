/**
 * Resend Email Client
 *
 * Singleton Resend client instance for sending transactional emails.
 * https://resend.com/docs
 */

import { Resend } from 'resend';

let _resendClient: Resend | null = null;

/**
 * Get (or lazily create) the Resend client singleton.
 * Throws if RESEND_API_KEY is not set.
 */
export function getResendClient(): Resend {
  if (!_resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    _resendClient = new Resend(apiKey);
  }
  return _resendClient;
}

export { Resend };

/**
 * Paystack API Client
 *
 * Handles Paystack payment initialization and subscription management
 * for African markets (Nigeria, Ghana, Kenya, South Africa, etc.)
 *
 * Paystack supports NGN, GHS, KES, ZAR, USD
 * Docs: https://paystack.com/docs/api/
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaystackInitializeParams {
  email: string;
  amount: number; // in kobo (NGN), pesewas (GHS), cents (KES/ZAR/USD)
  currency?: 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'USD';
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, string>;
  plan?: string; // Paystack plan code for subscriptions
  channels?: string[];
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
      customer_code: string;
    };
    metadata?: Record<string, string>;
    paid_at?: string;
  };
}

export interface PaystackPlanCreateParams {
  name: string;
  interval: 'monthly' | 'annually' | 'weekly';
  amount: number; // in smallest currency unit
  currency?: string;
  description?: string;
}

export interface PaystackPlanResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    plan_code: string;
    name: string;
    amount: number;
    interval: string;
    currency: string;
  };
}

export interface PaystackSubscriptionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    subscription_code: string;
    status: 'active' | 'non-renewing' | 'attention' | 'completed' | 'cancelled';
    plan: {
      plan_code: string;
      name: string;
      amount: number;
    };
    customer: {
      email: string;
    };
    next_payment_date?: string;
  };
}

// ─── Pricing (in smallest currency unit) ─────────────────────────────────────

// NGN pricing (1 USD ≈ 1600 NGN as of 2025)
export const PAYSTACK_NGN_PRICES: Record<string, Record<string, number>> = {
  business_listing: {
    basic: 4640000,    // ₦46,400/month (~$29)
    premium: 12640000, // ₦126,400/month (~$79)
  },
  safe_badge: {
    standard: 7840000, // ₦78,400/month (~$49)
  },
  b2b: {
    basic: 15840000,      // ₦158,400/month (~$99)
    professional: 31840000, // ₦318,400/month (~$199)
    enterprise: 47840000,   // ₦478,400/month (~$299)
  },
};

// USD pricing (same as Stripe, in cents)
export const PAYSTACK_USD_PRICES: Record<string, Record<string, number>> = {
  business_listing: {
    basic: 2900,
    premium: 7900,
  },
  safe_badge: {
    standard: 4900,
  },
  b2b: {
    basic: 9900,
    professional: 19900,
    enterprise: 29900,
  },
};

// ─── Client ───────────────────────────────────────────────────────────────────

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured');
  return key;
}

async function paystackRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Initialize a Paystack transaction (one-time or subscription)
 */
export async function initializeTransaction(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResponse> {
  return paystackRequest<PaystackInitializeResponse>('POST', '/transaction/initialize', {
    email: params.email,
    amount: params.amount,
    currency: params.currency ?? 'NGN',
    reference: params.reference ?? generateReference(),
    callback_url: params.callbackUrl,
    metadata: params.metadata,
    plan: params.plan,
    channels: params.channels ?? ['card', 'bank', 'ussd', 'mobile_money'],
  });
}

/**
 * Verify a Paystack transaction by reference
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  return paystackRequest<PaystackVerifyResponse>('GET', `/transaction/verify/${reference}`);
}

/**
 * Create a Paystack subscription plan
 */
export async function createPlan(
  params: PaystackPlanCreateParams
): Promise<PaystackPlanResponse> {
  return paystackRequest<PaystackPlanResponse>('POST', '/plan', {
    name: params.name,
    interval: params.interval,
    amount: params.amount,
    currency: params.currency ?? 'NGN',
    description: params.description,
  });
}

/**
 * Fetch a Paystack subscription by code
 */
export async function getSubscription(
  subscriptionCode: string
): Promise<PaystackSubscriptionResponse> {
  return paystackRequest<PaystackSubscriptionResponse>(
    'GET',
    `/subscription/${subscriptionCode}`
  );
}

/**
 * Cancel a Paystack subscription
 */
export async function cancelSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<{ status: boolean; message: string }> {
  return paystackRequest('POST', '/subscription/disable', {
    code: subscriptionCode,
    token: emailToken,
  });
}

/**
 * Verify a Paystack webhook signature
 * Uses HMAC-SHA512 with the secret key
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return false;

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(body)
  );

  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedSignature === signature;
}

/**
 * Generate a unique transaction reference
 */
export function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VH-${timestamp}-${random}`;
}

/**
 * Get the Paystack amount for a given type, tier, and currency
 */
export function getPaystackAmount(
  type: string,
  tier: string,
  currency: 'NGN' | 'USD' = 'NGN'
): number | null {
  const priceMap = currency === 'NGN' ? PAYSTACK_NGN_PRICES : PAYSTACK_USD_PRICES;
  return priceMap[type]?.[tier] ?? null;
}

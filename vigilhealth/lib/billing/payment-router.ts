/**
 * Payment Router
 *
 * Routes payment to Stripe or Paystack based on the user's currency/region.
 *
 * - African currencies (NGN, GHS, KES, ZAR) → Paystack
 * - USD, EUR, GBP, etc. → Stripe
 *
 * This allows Nigerian and other African users to pay via Paystack
 * while international users continue using Stripe.
 */

export type PaymentProvider = 'stripe' | 'paystack';

export type SupportedCurrency =
  | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' // Stripe
  | 'NGN' | 'GHS' | 'KES' | 'ZAR';         // Paystack

const PAYSTACK_CURRENCIES = new Set<string>(['NGN', 'GHS', 'KES', 'ZAR']);

/**
 * Determine which payment provider to use based on currency
 */
export function getPaymentProvider(currency: string): PaymentProvider {
  return PAYSTACK_CURRENCIES.has(currency.toUpperCase()) ? 'paystack' : 'stripe';
}

/**
 * Check if a currency is supported by Paystack
 */
export function isPaystackCurrency(currency: string): boolean {
  return PAYSTACK_CURRENCIES.has(currency.toUpperCase());
}

/**
 * Get the display name for a currency
 */
export function getCurrencyLabel(currency: string): string {
  const labels: Record<string, string> = {
    NGN: 'Nigerian Naira (₦)',
    GHS: 'Ghanaian Cedi (₵)',
    KES: 'Kenyan Shilling (KSh)',
    ZAR: 'South African Rand (R)',
    USD: 'US Dollar ($)',
    EUR: 'Euro (€)',
    GBP: 'British Pound (£)',
    CAD: 'Canadian Dollar (CA$)',
    AUD: 'Australian Dollar (A$)',
  };
  return labels[currency.toUpperCase()] ?? currency;
}

/**
 * Get the currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R',
    USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$',
  };
  return symbols[currency.toUpperCase()] ?? currency;
}

/**
 * Format an amount in the smallest currency unit to a display string
 */
export function formatAmount(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  // All supported currencies use 2 decimal places (kobo, pesewas, cents)
  const formatted = (amount / 100).toLocaleString('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
}

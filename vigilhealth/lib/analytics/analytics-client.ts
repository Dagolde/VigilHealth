/**
 * Analytics Client
 *
 * Privacy-friendly analytics tracking compatible with PostHog.
 * All events are anonymized — no PII is included.
 *
 * Tracks:
 * - DAU per geographic area
 * - Feature usage (Risk Radar, Symptom Checker, Supply Finder)
 * - Telehealth referral conversion rate
 * - B2B MRR
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'risk_radar_view'
  | 'symptom_checker_start'
  | 'symptom_checker_complete'
  | 'supply_finder_search'
  | 'telehealth_referral_created'
  | 'telehealth_referral_completed'
  | 'help_request_created'
  | 'help_request_fulfilled'
  | 'qa_question_created'
  | 'qa_answer_created'
  | 'business_subscription_created'
  | 'page_view'
  | 'dau_ping';

export interface AnalyticsEventPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  // Geographic area (city/state level only — no precise coordinates)
  geoArea?: string;
  // Anonymous session ID (not linked to user identity)
  sessionId?: string;
  timestamp?: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

class AnalyticsClient {
  private readonly endpoint: string;
  private readonly apiKey: string | undefined;
  private readonly enabled: boolean;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';
    this.apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    this.enabled = typeof window !== 'undefined' && !!this.apiKey;
  }

  /**
   * Track an analytics event.
   * Automatically strips any PII from properties.
   */
  track(payload: AnalyticsEventPayload): void {
    if (!this.enabled) return;

    const sanitized = this.sanitizePayload(payload);

    // PostHog-compatible event format
    const body = {
      api_key: this.apiKey,
      event: sanitized.event,
      properties: {
        ...sanitized.properties,
        geo_area: sanitized.geoArea,
        $session_id: sanitized.sessionId,
        $lib: 'vigilhealth-analytics',
      },
      timestamp: sanitized.timestamp ?? new Date().toISOString(),
    };

    // Fire-and-forget — don't block the UI
    void fetch(`${this.endpoint}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Silently fail — analytics should never break the app
    });
  }

  /**
   * Track a DAU ping for geographic area analytics.
   */
  trackDau(geoArea: string, sessionId: string): void {
    this.track({
      event: 'dau_ping',
      geoArea,
      sessionId,
      properties: { area: geoArea },
    });
  }

  /**
   * Track a feature usage event.
   */
  trackFeature(
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>
  ): void {
    this.track({ event, properties });
  }

  /**
   * Track telehealth referral conversion.
   */
  trackReferralConversion(providerId: string, converted: boolean): void {
    this.track({
      event: converted ? 'telehealth_referral_completed' : 'telehealth_referral_created',
      properties: { provider_id: providerId, converted },
    });
  }

  /**
   * Track B2B MRR event.
   */
  trackB2bMrr(tier: string, amountCents: number): void {
    this.track({
      event: 'business_subscription_created',
      properties: { tier, amount_cents: amountCents },
    });
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private sanitizePayload(payload: AnalyticsEventPayload): AnalyticsEventPayload {
    const sanitized = { ...payload };

    if (sanitized.properties) {
      // Remove any properties that look like PII
      const piiKeys = ['email', 'name', 'phone', 'address', 'ip', 'user_id', 'userId'];
      for (const key of piiKeys) {
        delete sanitized.properties[key];
      }
    }

    return sanitized;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const analytics = new AnalyticsClient();

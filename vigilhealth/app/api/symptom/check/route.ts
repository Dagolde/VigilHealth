/**
 * POST /api/symptom/check
 *
 * Runs the symptom matching engine server-side and returns disease matches
 * with confidence scores and recommendations.
 *
 * Privacy: Only stores anonymized data (no user_id, no IP) when
 * consentToStore === true. A random session token is used instead.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { matchSymptoms } from '@/lib/symptom-checker/outbreak-profiles';

// ─── Validation schema ────────────────────────────────────────────────────────

const SymptomCheckSchema = z.object({
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required.'),
  duration: z.number().int().min(1).max(30),
  severity: z.enum(['mild', 'moderate', 'severe']),
  location: z.string().optional(),
  consentToStore: z.boolean().optional(),
});

// ─── Response types ───────────────────────────────────────────────────────────

interface TelehealthProvider {
  id: string;
  name: string;
  waitTime: number;
  affiliateLink: string;
}

interface SymptomCheckResponse {
  matches: Array<{
    disease: string;
    confidence: number;
    commonSymptoms: string[];
    recommendation: 'monitor' | 'telehealth' | 'testing' | 'emergency';
    localPrevalence: 'low' | 'moderate' | 'high';
  }>;
  telehealth: {
    available: boolean;
    providers: TelehealthProvider[];
  };
  disclaimer: string;
}

// ─── Placeholder telehealth providers ────────────────────────────────────────

const TELEHEALTH_PROVIDERS: TelehealthProvider[] = [
  {
    id: 'teladoc',
    name: 'Teladoc Health',
    waitTime: 10,
    affiliateLink: 'https://www.teladoc.com',
  },
  {
    id: 'mdlive',
    name: 'MDLive',
    waitTime: 15,
    affiliateLink: 'https://www.mdlive.com',
  },
];

const DISCLAIMER =
  'This tool provides general health information only and is not a substitute for ' +
  'professional medical advice, diagnosis, or treatment. Always seek the advice of ' +
  'your physician or other qualified health provider with any questions you may have ' +
  'regarding a medical condition.';

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    // Validate with Zod
    const parseResult = SymptomCheckSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { symptoms, duration, severity, consentToStore } = parseResult.data;

    // Run matching engine server-side
    const matches = matchSymptoms(symptoms, duration, severity);

    // Privacy-preserving storage
    // The symptom_checks table does not exist yet — log intent only.
    // When consentToStore is true, we would store anonymized data:
    // { symptoms, duration, severity, timestamp, sessionToken } — NO user_id, NO IP.
    if (consentToStore === true) {
      const sessionToken = crypto.randomUUID();
      // Consent given — would store anonymized data with sessionToken
      // TODO: Insert into `symptom_checks` table once migration is applied:
      // await supabase.from('symptom_checks').insert({ session_token: sessionToken, symptoms, duration, severity })
      void sessionToken; // Suppress unused variable warning
    }

    // Determine if telehealth should be offered (any match with confidence > 70)
    const hasTelehealthRecommendation = matches.some(
      (m) => m.recommendation === 'telehealth' || m.recommendation === 'testing'
    );

    const response: SymptomCheckResponse = {
      matches,
      telehealth: {
        available: hasTelehealthRecommendation,
        providers: hasTelehealthRecommendation ? TELEHEALTH_PROVIDERS : [],
      },
      disclaimer: DISCLAIMER,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('[POST /api/symptom/check] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

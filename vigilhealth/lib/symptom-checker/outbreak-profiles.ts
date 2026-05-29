/**
 * Outbreak Profile Matching Engine
 *
 * Pure functions for matching user-reported symptoms against known disease profiles
 * and computing confidence scores (0-100).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiseaseProfile {
  disease: string;
  commonSymptoms: string[]; // symptoms that strongly indicate this disease
  possibleSymptoms: string[]; // symptoms that may appear
  emergencySymptoms: string[]; // symptoms requiring immediate attention
}

export interface SymptomMatch {
  disease: string;
  confidence: number; // 0-100
  commonSymptoms: string[]; // matched common symptoms
  recommendation: 'monitor' | 'telehealth' | 'testing' | 'emergency';
  localPrevalence: 'low' | 'moderate' | 'high'; // placeholder
}

export interface SymptomCheckResult {
  matches: SymptomMatch[];
  hasEmergency: boolean;
  topMatch: SymptomMatch | null;
}

// ─── Disease Profiles ─────────────────────────────────────────────────────────

export const DISEASE_PROFILES: DiseaseProfile[] = [
  {
    disease: 'COVID-19',
    commonSymptoms: ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell'],
    possibleSymptoms: ['shortness_of_breath', 'headache', 'body_aches', 'sore_throat', 'chills'],
    emergencySymptoms: ['shortness_of_breath', 'chest_pain'],
  },
  {
    disease: 'Influenza',
    commonSymptoms: ['fever', 'cough', 'body_aches', 'fatigue', 'chills'],
    possibleSymptoms: ['headache', 'sore_throat', 'runny_nose'],
    emergencySymptoms: [],
  },
  {
    disease: 'Common Cold',
    commonSymptoms: ['runny_nose', 'sore_throat', 'cough'],
    possibleSymptoms: ['headache', 'fatigue', 'body_aches'],
    emergencySymptoms: [],
  },
  {
    disease: 'Strep Throat',
    commonSymptoms: ['sore_throat', 'fever'],
    possibleSymptoms: ['headache', 'nausea', 'rash'],
    emergencySymptoms: [],
  },
  {
    disease: 'Norovirus',
    commonSymptoms: ['nausea', 'vomiting', 'diarrhea'],
    possibleSymptoms: ['fever', 'body_aches', 'fatigue'],
    emergencySymptoms: [],
  },
  {
    disease: 'Pneumonia',
    commonSymptoms: ['cough', 'fever', 'shortness_of_breath'],
    possibleSymptoms: ['chest_pain', 'fatigue', 'chills'],
    emergencySymptoms: ['shortness_of_breath', 'chest_pain'],
  },
  {
    disease: 'Allergic Reaction',
    commonSymptoms: ['runny_nose', 'rash'],
    possibleSymptoms: ['cough', 'fatigue'],
    emergencySymptoms: [],
  },
  {
    disease: 'Heat Exhaustion',
    commonSymptoms: ['fatigue', 'headache', 'nausea'],
    possibleSymptoms: ['diarrhea', 'body_aches'],
    emergencySymptoms: [],
  },
];

// ─── Emergency symptoms ───────────────────────────────────────────────────────

export const EMERGENCY_SYMPTOMS = ['shortness_of_breath', 'chest_pain'];

// ─── Confidence scoring ───────────────────────────────────────────────────────

/**
 * Determine recommendation based on confidence and emergency symptoms.
 */
function determineRecommendation(
  confidence: number,
  hasEmergencySymptom: boolean
): 'monitor' | 'telehealth' | 'testing' | 'emergency' {
  if (hasEmergencySymptom) return 'emergency';
  if (confidence >= 70) return 'testing';
  if (confidence >= 30) return 'telehealth';
  return 'monitor';
}

/**
 * Match symptoms against all disease profiles and return scored matches.
 *
 * Confidence scoring algorithm:
 * - Base score = (matched common symptoms / total common symptoms) × 60
 * - Bonus = (matched possible symptoms / total possible symptoms) × 20
 * - Severity bonus: mild=0, moderate=+10, severe=+20
 * - Duration bonus: 1-3 days=0, 4-7 days=+5, >7 days=+10
 * - Cap at 100
 * - Only return matches with confidence ≥ 10
 * - Sort by confidence descending
 */
export function matchSymptoms(
  symptoms: string[],
  duration: number,
  severity: 'mild' | 'moderate' | 'severe'
): SymptomMatch[] {
  if (symptoms.length === 0) {
    return [];
  }

  const symptomSet = new Set(symptoms);

  // Severity bonus
  const severityBonus = severity === 'severe' ? 20 : severity === 'moderate' ? 10 : 0;

  // Duration bonus
  let durationBonus = 0;
  if (duration > 7) {
    durationBonus = 10;
  } else if (duration >= 4) {
    durationBonus = 5;
  }

  // Check if any emergency symptoms are present
  const hasEmergencySymptom = EMERGENCY_SYMPTOMS.some((s) => symptomSet.has(s));

  const matches: SymptomMatch[] = [];

  for (const profile of DISEASE_PROFILES) {
    // Matched common symptoms
    const matchedCommon = profile.commonSymptoms.filter((s) => symptomSet.has(s));
    const matchedPossible = profile.possibleSymptoms.filter((s) => symptomSet.has(s));

    // Base score from common symptoms
    const baseScore =
      profile.commonSymptoms.length > 0
        ? (matchedCommon.length / profile.commonSymptoms.length) * 60
        : 0;

    // Bonus from possible symptoms
    const possibleBonus =
      profile.possibleSymptoms.length > 0
        ? (matchedPossible.length / profile.possibleSymptoms.length) * 20
        : 0;

    const rawConfidence = baseScore + possibleBonus + severityBonus + durationBonus;
    const confidence = Math.min(100, Math.round(rawConfidence));

    if (confidence < 10) continue;

    // Check if this profile has emergency symptoms matched
    const profileHasEmergency =
      profile.emergencySymptoms.length > 0 &&
      profile.emergencySymptoms.some((s) => symptomSet.has(s));

    const recommendation = determineRecommendation(
      confidence,
      hasEmergencySymptom && profileHasEmergency
    );

    matches.push({
      disease: profile.disease,
      confidence,
      commonSymptoms: matchedCommon,
      recommendation,
      localPrevalence: 'low',
    });
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Run the full symptom check and return structured result.
 */
export function runSymptomCheck(
  symptoms: string[],
  duration: number,
  severity: 'mild' | 'moderate' | 'severe'
): SymptomCheckResult {
  const matches = matchSymptoms(symptoms, duration, severity);
  const hasEmergency = EMERGENCY_SYMPTOMS.some((s) => symptoms.includes(s));

  return {
    matches,
    hasEmergency,
    topMatch: matches.length > 0 ? matches[0] : null,
  };
}

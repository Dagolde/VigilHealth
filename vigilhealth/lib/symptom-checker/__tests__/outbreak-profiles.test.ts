/**
 * Unit tests for outbreak-profiles.ts
 *
 * Tests for the matchSymptoms function covering:
 * 1. Empty symptoms input
 * 2. COVID-19 high confidence match
 * 3. Emergency symptoms produce emergency recommendation
 * 4. Results sorted by confidence descending
 * 5. Confidence always between 0 and 100
 * 6. Mild severity produces lower confidence than severe severity
 * 7. Short duration produces lower confidence than long duration
 * 8. Only returns matches with confidence ≥ 10
 */

import { describe, expect, it } from 'vitest';

import { matchSymptoms } from '../outbreak-profiles';

// ─── 1. Empty symptoms ────────────────────────────────────────────────────────

describe('matchSymptoms — empty input', () => {
  it('returns empty array for empty symptoms input', () => {
    const result = matchSymptoms([], 3, 'mild');
    expect(result).toEqual([]);
  });
});

// ─── 2. COVID-19 high confidence ──────────────────────────────────────────────

describe('matchSymptoms — COVID-19 detection', () => {
  it('produces a high confidence COVID-19 match for all 4 common symptoms', () => {
    const symptoms = ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell'];
    const result = matchSymptoms(symptoms, 5, 'moderate');

    const covidMatch = result.find((m) => m.disease === 'COVID-19');
    expect(covidMatch).toBeDefined();
    // 4/4 common = 60 base + 0 possible + 10 moderate + 5 duration = 75
    expect(covidMatch!.confidence).toBeGreaterThanOrEqual(70);
  });

  it('COVID-19 match includes matched common symptoms', () => {
    const symptoms = ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell'];
    const result = matchSymptoms(symptoms, 3, 'mild');

    const covidMatch = result.find((m) => m.disease === 'COVID-19');
    expect(covidMatch).toBeDefined();
    expect(covidMatch!.commonSymptoms).toContain('fever');
    expect(covidMatch!.commonSymptoms).toContain('cough');
    expect(covidMatch!.commonSymptoms).toContain('fatigue');
    expect(covidMatch!.commonSymptoms).toContain('loss_of_taste_or_smell');
  });

  it('COVID-19 is the top match when all 4 common symptoms are present', () => {
    const symptoms = ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell'];
    const result = matchSymptoms(symptoms, 3, 'mild');

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].disease).toBe('COVID-19');
  });
});

// ─── 3. Emergency symptoms ────────────────────────────────────────────────────

describe('matchSymptoms — emergency detection', () => {
  it('chest_pain produces emergency recommendation for Pneumonia', () => {
    const symptoms = ['cough', 'fever', 'shortness_of_breath', 'chest_pain'];
    const result = matchSymptoms(symptoms, 3, 'severe');

    const pneumoniaMatch = result.find((m) => m.disease === 'Pneumonia');
    expect(pneumoniaMatch).toBeDefined();
    expect(pneumoniaMatch!.recommendation).toBe('emergency');
  });

  it('shortness_of_breath produces emergency recommendation for COVID-19', () => {
    const symptoms = ['fever', 'cough', 'fatigue', 'shortness_of_breath'];
    const result = matchSymptoms(symptoms, 3, 'severe');

    const covidMatch = result.find((m) => m.disease === 'COVID-19');
    expect(covidMatch).toBeDefined();
    expect(covidMatch!.recommendation).toBe('emergency');
  });

  it('emergency recommendation overrides confidence-based recommendation', () => {
    // Even with low confidence, emergency symptoms → emergency recommendation
    const symptoms = ['chest_pain', 'shortness_of_breath'];
    const result = matchSymptoms(symptoms, 1, 'mild');

    // Pneumonia has both as emergency symptoms
    const pneumoniaMatch = result.find((m) => m.disease === 'Pneumonia');
    if (pneumoniaMatch) {
      expect(pneumoniaMatch.recommendation).toBe('emergency');
    }

    // COVID-19 also has both as emergency symptoms
    const covidMatch = result.find((m) => m.disease === 'COVID-19');
    if (covidMatch) {
      expect(covidMatch.recommendation).toBe('emergency');
    }
  });
});

// ─── 4. Sorted by confidence descending ──────────────────────────────────────

describe('matchSymptoms — sort order', () => {
  it('results are sorted by confidence descending', () => {
    const symptoms = ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell', 'body_aches'];
    const result = matchSymptoms(symptoms, 5, 'moderate');

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
    }
  });

  it('single symptom results are still sorted (trivially)', () => {
    const result = matchSymptoms(['fever'], 3, 'mild');
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
    }
  });
});

// ─── 5. Confidence between 0 and 100 ─────────────────────────────────────────

describe('matchSymptoms — confidence bounds', () => {
  it('confidence is always between 0 and 100 for typical symptoms', () => {
    const symptoms = ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell', 'body_aches', 'chills'];
    const result = matchSymptoms(symptoms, 14, 'severe');

    for (const match of result) {
      expect(match.confidence).toBeGreaterThanOrEqual(0);
      expect(match.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('confidence does not exceed 100 even with all bonuses maxed', () => {
    // All possible symptoms for COVID-19 + severe + long duration
    const symptoms = [
      'fever', 'cough', 'fatigue', 'loss_of_taste_or_smell',
      'shortness_of_breath', 'headache', 'body_aches', 'sore_throat', 'chills',
    ];
    const result = matchSymptoms(symptoms, 30, 'severe');

    for (const match of result) {
      expect(match.confidence).toBeLessThanOrEqual(100);
    }
  });
});

// ─── 6. Severity affects confidence ──────────────────────────────────────────

describe('matchSymptoms — severity bonus', () => {
  it('mild severity produces lower confidence than severe severity for same symptoms', () => {
    const symptoms = ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell'];

    const mildResult = matchSymptoms(symptoms, 3, 'mild');
    const severeResult = matchSymptoms(symptoms, 3, 'severe');

    const mildCovid = mildResult.find((m) => m.disease === 'COVID-19');
    const severeCovid = severeResult.find((m) => m.disease === 'COVID-19');

    expect(mildCovid).toBeDefined();
    expect(severeCovid).toBeDefined();
    expect(mildCovid!.confidence).toBeLessThan(severeCovid!.confidence);
  });

  it('moderate severity produces lower confidence than severe severity', () => {
    const symptoms = ['nausea', 'vomiting', 'diarrhea'];

    const moderateResult = matchSymptoms(symptoms, 3, 'moderate');
    const severeResult = matchSymptoms(symptoms, 3, 'severe');

    const moderateMatch = moderateResult.find((m) => m.disease === 'Norovirus');
    const severeMatch = severeResult.find((m) => m.disease === 'Norovirus');

    expect(moderateMatch).toBeDefined();
    expect(severeMatch).toBeDefined();
    expect(moderateMatch!.confidence).toBeLessThan(severeMatch!.confidence);
  });
});

// ─── 7. Duration affects confidence ──────────────────────────────────────────

describe('matchSymptoms — duration bonus', () => {
  it('short duration (1-3 days) produces lower confidence than long duration (>7 days)', () => {
    const symptoms = ['fever', 'cough', 'body_aches', 'fatigue', 'chills'];

    const shortResult = matchSymptoms(symptoms, 2, 'mild');
    const longResult = matchSymptoms(symptoms, 10, 'mild');

    const shortFlu = shortResult.find((m) => m.disease === 'Influenza');
    const longFlu = longResult.find((m) => m.disease === 'Influenza');

    expect(shortFlu).toBeDefined();
    expect(longFlu).toBeDefined();
    expect(shortFlu!.confidence).toBeLessThan(longFlu!.confidence);
  });

  it('medium duration (4-7 days) produces lower confidence than long duration (>7 days)', () => {
    const symptoms = ['runny_nose', 'sore_throat', 'cough'];

    const mediumResult = matchSymptoms(symptoms, 5, 'mild');
    const longResult = matchSymptoms(symptoms, 14, 'mild');

    const mediumCold = mediumResult.find((m) => m.disease === 'Common Cold');
    const longCold = longResult.find((m) => m.disease === 'Common Cold');

    expect(mediumCold).toBeDefined();
    expect(longCold).toBeDefined();
    expect(mediumCold!.confidence).toBeLessThan(longCold!.confidence);
  });
});

// ─── 8. Minimum confidence threshold ─────────────────────────────────────────

describe('matchSymptoms — minimum confidence threshold', () => {
  it('only returns matches with confidence ≥ 10', () => {
    // A single unrelated symptom should not produce many matches
    const result = matchSymptoms(['rash'], 1, 'mild');

    for (const match of result) {
      expect(match.confidence).toBeGreaterThanOrEqual(10);
    }
  });

  it('does not return matches with confidence < 10', () => {
    // Symptoms that don't match most diseases well
    const result = matchSymptoms(['rash'], 1, 'mild');

    // All returned matches must have confidence >= 10
    const lowConfidenceMatches = result.filter((m) => m.confidence < 10);
    expect(lowConfidenceMatches).toHaveLength(0);
  });
});

// ─── Recommendation thresholds ────────────────────────────────────────────────

describe('matchSymptoms — recommendation thresholds', () => {
  it('high confidence (≥70) produces testing recommendation (no emergency)', () => {
    // All 4 common COVID symptoms + severe + long duration → very high confidence
    const symptoms = ['fever', 'cough', 'fatigue', 'loss_of_taste_or_smell'];
    const result = matchSymptoms(symptoms, 10, 'severe');

    const covidMatch = result.find((m) => m.disease === 'COVID-19');
    expect(covidMatch).toBeDefined();
    // 60 base + 0 possible + 20 severe + 10 duration = 90 → testing
    expect(covidMatch!.recommendation).toBe('testing');
  });

  it('low confidence (<30) produces monitor recommendation', () => {
    // Only 1 of 4 common COVID symptoms, mild, short duration
    const result = matchSymptoms(['fever'], 1, 'mild');

    const covidMatch = result.find((m) => m.disease === 'COVID-19');
    if (covidMatch) {
      // 1/4 * 60 = 15 base + 0 + 0 + 0 = 15 → monitor
      expect(covidMatch.recommendation).toBe('monitor');
    }
  });
});

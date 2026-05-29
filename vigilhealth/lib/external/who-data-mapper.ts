/**
 * WHO Data Mapper
 * 
 * Maps WHO outbreak data to internal InternalRiskData schema.
 * Normalizes data for storage in the risk_levels table.
 */

import type { ParsedWHOData } from './who-data-parser';

export interface InternalRiskData {
  source: 'who';
  disease: string;
  locations: Array<{
    country: string;
    lat: number;
    lng: number;
  }>;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  caseCount: number;
  timestamp: string;
  sourceUrl: string;
}

/**
 * Country to coordinates mapping
 * This is a simplified mapping for MVP. In production, use a geocoding service.
 */
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Africa
  'Algeria': { lat: 28.0339, lng: 1.6596 },
  'Angola': { lat: -11.2027, lng: 17.8739 },
  'Benin': { lat: 9.3077, lng: 2.3158 },
  'Botswana': { lat: -22.3285, lng: 24.6849 },
  'Burkina Faso': { lat: 12.2383, lng: -1.5616 },
  'Burundi': { lat: -3.3731, lng: 29.9189 },
  'Cameroon': { lat: 7.3697, lng: 12.3547 },
  'Central African Republic': { lat: 6.6111, lng: 20.9394 },
  'Chad': { lat: 15.4542, lng: 18.7322 },
  'Congo': { lat: -4.0383, lng: 21.7587 },
  'Democratic Republic of the Congo': { lat: -4.0383, lng: 21.7587 },
  'Djibouti': { lat: 11.8251, lng: 42.5903 },
  'Egypt': { lat: 26.8206, lng: 30.8025 },
  'Equatorial Guinea': { lat: 1.6508, lng: 10.2679 },
  'Eritrea': { lat: 15.1794, lng: 39.7823 },
  'Ethiopia': { lat: 9.1450, lng: 40.4897 },
  'Gabon': { lat: -0.8037, lng: 11.6094 },
  'Gambia': { lat: 13.4432, lng: -15.3101 },
  'Ghana': { lat: 7.9465, lng: -1.0232 },
  'Guinea': { lat: 9.9456, lng: -9.6966 },
  'Guinea-Bissau': { lat: 11.8037, lng: -15.1804 },
  'Kenya': { lat: -0.0236, lng: 37.9062 },
  'Lesotho': { lat: -29.6100, lng: 28.2336 },
  'Liberia': { lat: 6.4281, lng: -9.4295 },
  'Libya': { lat: 26.3351, lng: 17.2283 },
  'Madagascar': { lat: -18.7669, lng: 46.8691 },
  'Malawi': { lat: -13.2543, lng: 34.3015 },
  'Mali': { lat: 17.5707, lng: -3.9962 },
  'Mauritania': { lat: 21.0079, lng: -10.9408 },
  'Morocco': { lat: 31.7917, lng: -7.0926 },
  'Mozambique': { lat: -18.6657, lng: 35.5296 },
  'Namibia': { lat: -22.9576, lng: 18.4904 },
  'Niger': { lat: 17.6078, lng: 8.0817 },
  'Nigeria': { lat: 9.0820, lng: 8.6753 },
  'Rwanda': { lat: -1.9403, lng: 29.8739 },
  'Senegal': { lat: 14.4974, lng: -14.4524 },
  'Sierra Leone': { lat: 8.4606, lng: -11.7799 },
  'Somalia': { lat: 5.1521, lng: 46.1996 },
  'South Africa': { lat: -30.5595, lng: 22.9375 },
  'South Sudan': { lat: 6.8770, lng: 31.3070 },
  'Sudan': { lat: 12.8628, lng: 30.2176 },
  'Tanzania': { lat: -6.3690, lng: 34.8888 },
  'Togo': { lat: 8.6195, lng: 0.8248 },
  'Tunisia': { lat: 33.8869, lng: 9.5375 },
  'Uganda': { lat: 1.3733, lng: 32.2903 },
  'Zambia': { lat: -13.1339, lng: 27.8493 },
  'Zimbabwe': { lat: -19.0154, lng: 29.1549 },

  // Americas
  'Argentina': { lat: -38.4161, lng: -63.6167 },
  'Bolivia': { lat: -16.2902, lng: -63.5887 },
  'Brazil': { lat: -14.2350, lng: -51.9253 },
  'Canada': { lat: 56.1304, lng: -106.3468 },
  'Chile': { lat: -35.6751, lng: -71.5430 },
  'Colombia': { lat: 4.5709, lng: -74.2973 },
  'Costa Rica': { lat: 9.7489, lng: -83.7534 },
  'Cuba': { lat: 21.5218, lng: -77.7812 },
  'Ecuador': { lat: -1.8312, lng: -78.1834 },
  'El Salvador': { lat: 13.7942, lng: -88.8965 },
  'Guatemala': { lat: 15.7835, lng: -90.2308 },
  'Haiti': { lat: 18.9712, lng: -72.2852 },
  'Honduras': { lat: 15.2000, lng: -86.2419 },
  'Mexico': { lat: 23.6345, lng: -102.5528 },
  'Nicaragua': { lat: 12.8654, lng: -85.2072 },
  'Panama': { lat: 8.5380, lng: -80.7821 },
  'Paraguay': { lat: -23.4425, lng: -58.4438 },
  'Peru': { lat: -9.1900, lng: -75.0152 },
  'United States': { lat: 37.0902, lng: -95.7129 },
  'Uruguay': { lat: -32.5228, lng: -55.7658 },
  'Venezuela': { lat: 6.4238, lng: -66.5897 },

  // Asia
  'Afghanistan': { lat: 33.9391, lng: 67.7100 },
  'Bangladesh': { lat: 23.6850, lng: 90.3563 },
  'Bhutan': { lat: 27.5142, lng: 90.4336 },
  'Cambodia': { lat: 12.5657, lng: 104.9910 },
  'China': { lat: 35.8617, lng: 104.1954 },
  'India': { lat: 20.5937, lng: 78.9629 },
  'Indonesia': { lat: -0.7893, lng: 113.9213 },
  'Iran': { lat: 32.4279, lng: 53.6880 },
  'Iraq': { lat: 33.2232, lng: 43.6793 },
  'Japan': { lat: 36.2048, lng: 138.2529 },
  'Jordan': { lat: 30.5852, lng: 36.2384 },
  'Kazakhstan': { lat: 48.0196, lng: 66.9237 },
  'Kuwait': { lat: 29.3117, lng: 47.4818 },
  'Kyrgyzstan': { lat: 41.2044, lng: 74.7661 },
  'Laos': { lat: 19.8563, lng: 102.4955 },
  'Lebanon': { lat: 33.8547, lng: 35.8623 },
  'Malaysia': { lat: 4.2105, lng: 101.9758 },
  'Mongolia': { lat: 46.8625, lng: 103.8467 },
  'Myanmar': { lat: 21.9162, lng: 95.9560 },
  'Nepal': { lat: 28.3949, lng: 84.1240 },
  'North Korea': { lat: 40.3399, lng: 127.5101 },
  'Oman': { lat: 21.4735, lng: 55.9754 },
  'Pakistan': { lat: 30.3753, lng: 69.3451 },
  'Philippines': { lat: 12.8797, lng: 121.7740 },
  'Qatar': { lat: 25.3548, lng: 51.1839 },
  'Saudi Arabia': { lat: 23.8859, lng: 45.0792 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'South Korea': { lat: 35.9078, lng: 127.7669 },
  'Sri Lanka': { lat: 7.8731, lng: 80.7718 },
  'Syria': { lat: 34.8021, lng: 38.9968 },
  'Taiwan': { lat: 23.6978, lng: 120.9605 },
  'Tajikistan': { lat: 38.8610, lng: 71.2761 },
  'Thailand': { lat: 15.8700, lng: 100.9925 },
  'Turkey': { lat: 38.9637, lng: 35.2433 },
  'Turkmenistan': { lat: 38.9697, lng: 59.5563 },
  'United Arab Emirates': { lat: 23.4241, lng: 53.8478 },
  'Uzbekistan': { lat: 41.3775, lng: 64.5853 },
  'Vietnam': { lat: 14.0583, lng: 108.2772 },
  'Yemen': { lat: 15.5527, lng: 48.5164 },

  // Europe
  'Albania': { lat: 41.1533, lng: 20.1683 },
  'Austria': { lat: 47.5162, lng: 14.5501 },
  'Belarus': { lat: 53.7098, lng: 27.9534 },
  'Belgium': { lat: 50.5039, lng: 4.4699 },
  'Bosnia and Herzegovina': { lat: 43.9159, lng: 17.6791 },
  'Bulgaria': { lat: 42.7339, lng: 25.4858 },
  'Croatia': { lat: 45.1, lng: 15.2 },
  'Czech Republic': { lat: 49.8175, lng: 15.4730 },
  'Denmark': { lat: 56.2639, lng: 9.5018 },
  'Estonia': { lat: 58.5953, lng: 25.0136 },
  'Finland': { lat: 61.9241, lng: 25.7482 },
  'France': { lat: 46.2276, lng: 2.2137 },
  'Germany': { lat: 51.1657, lng: 10.4515 },
  'Greece': { lat: 39.0742, lng: 21.8243 },
  'Hungary': { lat: 47.1625, lng: 19.5033 },
  'Iceland': { lat: 64.9631, lng: -19.0208 },
  'Ireland': { lat: 53.4129, lng: -8.2439 },
  'Italy': { lat: 41.8719, lng: 12.5674 },
  'Latvia': { lat: 56.8796, lng: 24.6032 },
  'Lithuania': { lat: 55.1694, lng: 23.8813 },
  'Luxembourg': { lat: 49.8153, lng: 6.1296 },
  'Moldova': { lat: 47.4116, lng: 28.3699 },
  'Netherlands': { lat: 52.1326, lng: 5.2913 },
  'Norway': { lat: 60.4720, lng: 8.4689 },
  'Poland': { lat: 51.9194, lng: 19.1451 },
  'Portugal': { lat: 39.3999, lng: -8.2245 },
  'Romania': { lat: 45.9432, lng: 24.9668 },
  'Russia': { lat: 61.5240, lng: 105.3188 },
  'Serbia': { lat: 44.0165, lng: 21.0059 },
  'Slovakia': { lat: 48.6690, lng: 19.6990 },
  'Slovenia': { lat: 46.1512, lng: 14.9955 },
  'Spain': { lat: 40.4637, lng: -3.7492 },
  'Sweden': { lat: 60.1282, lng: 18.6435 },
  'Switzerland': { lat: 46.8182, lng: 8.2275 },
  'Ukraine': { lat: 48.3794, lng: 31.1656 },
  'United Kingdom': { lat: 55.3781, lng: -3.4360 },

  // Oceania
  'Australia': { lat: -25.2744, lng: 133.7751 },
  'Fiji': { lat: -17.7134, lng: 178.0650 },
  'New Zealand': { lat: -40.9006, lng: 174.8860 },
  'Papua New Guinea': { lat: -6.3150, lng: 143.9555 },
};

/**
 * Calculates severity level based on case count
 * This is a simplified heuristic. In production, use more sophisticated logic.
 * @param caseCount - Number of cases
 * @returns Severity level
 */
function calculateSeverity(caseCount: number): 'low' | 'moderate' | 'high' | 'critical' {
  if (caseCount === 0) return 'low';
  if (caseCount < 100) return 'low';
  if (caseCount < 1000) return 'moderate';
  if (caseCount < 10000) return 'high';
  return 'critical';
}

/**
 * Maps parsed WHO data to internal risk data schema
 * @param parsedData - Parsed WHO outbreak data
 * @returns Internal risk data or null if mapping fails
 */
export function mapWHOToInternal(parsedData: ParsedWHOData): InternalRiskData | null {
  try {
    // Map countries to coordinates
    const locations = parsedData.countries
      .map((country) => {
        const coords = COUNTRY_COORDINATES[country];
        if (!coords) {
          return null;
        }
        return {
          country,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter((loc): loc is { country: string; lat: number; lng: number } => loc !== null);

    // If no valid locations, return null
    if (locations.length === 0) {
      return null;
    }

    // Calculate severity based on case count
    const severity = calculateSeverity(parsedData.caseCount);

    // Convert published date to ISO timestamp
    const timestamp = new Date(parsedData.publishedDate).toISOString();

    return {
      source: 'who',
      disease: parsedData.disease,
      locations,
      severity,
      caseCount: parsedData.caseCount,
      timestamp,
      sourceUrl: parsedData.sourceUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Maps multiple parsed WHO data records to internal format
 * @param parsedDataArray - Array of parsed WHO data
 * @returns Array of internal risk data (invalid records filtered out)
 */
export function mapWHODataToInternal(parsedDataArray: ParsedWHOData[]): InternalRiskData[] {
  if (!Array.isArray(parsedDataArray)) {
    return [];
  }

  return parsedDataArray
    .map(mapWHOToInternal)
    .filter((mapped): mapped is InternalRiskData => mapped !== null);
}

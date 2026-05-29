/**
 * FIPS Code Geocoder
 * 
 * Maps US county FIPS codes to geographic coordinates (county centroids).
 * This is a simplified mapping for MVP. In production, use a comprehensive
 * geocoding service or database.
 */

export interface FIPSLocation {
  fipsCode: string;
  state: string;
  county: string;
  lat: number;
  lng: number;
}

/**
 * FIPS code to coordinates mapping
 * This is a subset of US counties for MVP demonstration.
 * In production, use a complete FIPS database or geocoding API.
 * 
 * Format: FIPS code (5 digits) -> { state, county, lat, lng }
 * Source: US Census Bureau county centroids
 */
const FIPS_COORDINATES: Record<string, Omit<FIPSLocation, 'fipsCode'>> = {
  // California counties (sample)
  '06001': { state: 'California', county: 'Alameda', lat: 37.6017, lng: -121.7195 },
  '06013': { state: 'California', county: 'Contra Costa', lat: 37.9161, lng: -121.9511 },
  '06037': { state: 'California', county: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  '06059': { state: 'California', county: 'Orange', lat: 33.7175, lng: -117.8311 },
  '06065': { state: 'California', county: 'Riverside', lat: 33.7455, lng: -116.2023 },
  '06067': { state: 'California', county: 'Sacramento', lat: 38.4747, lng: -121.3542 },
  '06071': { state: 'California', county: 'San Bernardino', lat: 34.8406, lng: -116.5453 },
  '06073': { state: 'California', county: 'San Diego', lat: 32.7157, lng: -117.1611 },
  '06075': { state: 'California', county: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  '06081': { state: 'California', county: 'San Mateo', lat: 37.4337, lng: -122.4014 },
  '06085': { state: 'California', county: 'Santa Clara', lat: 37.3541, lng: -121.9552 },

  // New York counties (sample)
  '36005': { state: 'New York', county: 'Bronx', lat: 40.8448, lng: -73.8648 },
  '36047': { state: 'New York', county: 'Kings', lat: 40.6782, lng: -73.9442 },
  '36061': { state: 'New York', county: 'New York', lat: 40.7831, lng: -73.9712 },
  '36081': { state: 'New York', county: 'Queens', lat: 40.7282, lng: -73.7949 },
  '36085': { state: 'New York', county: 'Richmond', lat: 40.5795, lng: -74.1502 },

  // Texas counties (sample)
  '48029': { state: 'Texas', county: 'Bexar', lat: 29.4241, lng: -98.4936 },
  '48113': { state: 'Texas', county: 'Dallas', lat: 32.7767, lng: -96.7970 },
  '48201': { state: 'Texas', county: 'Harris', lat: 29.7604, lng: -95.3698 },
  '48453': { state: 'Texas', county: 'Travis', lat: 30.2672, lng: -97.7431 },

  // Florida counties (sample)
  '12011': { state: 'Florida', county: 'Broward', lat: 26.1224, lng: -80.1373 },
  '12031': { state: 'Florida', county: 'Duval', lat: 30.3322, lng: -81.6557 },
  '12057': { state: 'Florida', county: 'Hillsborough', lat: 27.9506, lng: -82.4572 },
  '12086': { state: 'Florida', county: 'Miami-Dade', lat: 25.7617, lng: -80.1918 },
  '12095': { state: 'Florida', county: 'Orange', lat: 28.5383, lng: -81.3792 },
  '12103': { state: 'Florida', county: 'Pinellas', lat: 27.9506, lng: -82.8307 },

  // Illinois counties (sample)
  '17031': { state: 'Illinois', county: 'Cook', lat: 41.8781, lng: -87.6298 },
  '17043': { state: 'Illinois', county: 'DuPage', lat: 41.8369, lng: -88.0817 },
  '17097': { state: 'Illinois', county: 'Lake', lat: 42.3370, lng: -87.8450 },

  // Pennsylvania counties (sample)
  '42003': { state: 'Pennsylvania', county: 'Allegheny', lat: 40.4406, lng: -79.9959 },
  '42101': { state: 'Pennsylvania', county: 'Philadelphia', lat: 39.9526, lng: -75.1652 },

  // Ohio counties (sample)
  '39035': { state: 'Ohio', county: 'Cuyahoga', lat: 41.4993, lng: -81.6944 },
  '39049': { state: 'Ohio', county: 'Franklin', lat: 39.9612, lng: -82.9988 },
  '39061': { state: 'Ohio', county: 'Hamilton', lat: 39.1031, lng: -84.5120 },

  // Georgia counties (sample)
  '13063': { state: 'Georgia', county: 'Clayton', lat: 33.5379, lng: -84.3705 },
  '13067': { state: 'Georgia', county: 'Cobb', lat: 33.9698, lng: -84.5816 },
  '13089': { state: 'Georgia', county: 'DeKalb', lat: 33.7490, lng: -84.2277 },
  '13121': { state: 'Georgia', county: 'Fulton', lat: 33.7490, lng: -84.3880 },
  '13135': { state: 'Georgia', county: 'Gwinnett', lat: 33.9526, lng: -84.0719 },

  // North Carolina counties (sample)
  '37063': { state: 'North Carolina', county: 'Durham', lat: 35.9940, lng: -78.8986 },
  '37119': { state: 'North Carolina', county: 'Mecklenburg', lat: 35.2271, lng: -80.8431 },
  '37183': { state: 'North Carolina', county: 'Wake', lat: 35.7796, lng: -78.6382 },

  // Michigan counties (sample)
  '26081': { state: 'Michigan', county: 'Kent', lat: 42.9634, lng: -85.6681 },
  '26099': { state: 'Michigan', county: 'Macomb', lat: 42.6389, lng: -82.9179 },
  '26125': { state: 'Michigan', county: 'Oakland', lat: 42.6611, lng: -83.3874 },
  '26163': { state: 'Michigan', county: 'Wayne', lat: 42.3314, lng: -83.0458 },

  // New Jersey counties (sample)
  '34003': { state: 'New Jersey', county: 'Bergen', lat: 40.9265, lng: -74.0776 },
  '34013': { state: 'New Jersey', county: 'Essex', lat: 40.7834, lng: -74.2291 },
  '34017': { state: 'New Jersey', county: 'Hudson', lat: 40.7453, lng: -74.0446 },
  '34023': { state: 'New Jersey', county: 'Middlesex', lat: 40.4406, lng: -74.4121 },

  // Virginia counties (sample)
  '51013': { state: 'Virginia', county: 'Arlington', lat: 38.8816, lng: -77.0910 },
  '51059': { state: 'Virginia', county: 'Fairfax', lat: 38.8462, lng: -77.3064 },
  '51087': { state: 'Virginia', county: 'Henrico', lat: 37.5407, lng: -77.4360 },

  // Washington counties (sample)
  '53033': { state: 'Washington', county: 'King', lat: 47.6062, lng: -122.3321 },
  '53053': { state: 'Washington', county: 'Pierce', lat: 47.2529, lng: -122.4443 },
  '53061': { state: 'Washington', county: 'Snohomish', lat: 47.9290, lng: -122.2021 },

  // Arizona counties (sample)
  '04013': { state: 'Arizona', county: 'Maricopa', lat: 33.4484, lng: -112.0740 },
  '04019': { state: 'Arizona', county: 'Pima', lat: 32.2217, lng: -110.9265 },

  // Massachusetts counties (sample)
  '25017': { state: 'Massachusetts', county: 'Middlesex', lat: 42.3601, lng: -71.0589 },
  '25021': { state: 'Massachusetts', county: 'Norfolk', lat: 42.2529, lng: -71.1828 },
  '25025': { state: 'Massachusetts', county: 'Suffolk', lat: 42.3601, lng: -71.0589 },

  // Tennessee counties (sample)
  '47037': { state: 'Tennessee', county: 'Davidson', lat: 36.1627, lng: -86.7816 },
  '47157': { state: 'Tennessee', county: 'Shelby', lat: 35.1495, lng: -89.9711 },

  // Indiana counties (sample)
  '18097': { state: 'Indiana', county: 'Marion', lat: 39.7684, lng: -86.1581 },

  // Missouri counties (sample)
  '29095': { state: 'Missouri', county: 'Jackson', lat: 39.0997, lng: -94.5786 },
  '29189': { state: 'Missouri', county: 'St. Louis', lat: 38.6270, lng: -90.1994 },
  '29510': { state: 'Missouri', county: 'St. Louis City', lat: 38.6270, lng: -90.1994 },

  // Wisconsin counties (sample)
  '55079': { state: 'Wisconsin', county: 'Milwaukee', lat: 43.0389, lng: -87.9065 },

  // Maryland counties (sample)
  '24003': { state: 'Maryland', county: 'Anne Arundel', lat: 39.0458, lng: -76.6413 },
  '24005': { state: 'Maryland', county: 'Baltimore', lat: 39.2904, lng: -76.6122 },
  '24031': { state: 'Maryland', county: 'Montgomery', lat: 39.1434, lng: -77.2014 },
  '24033': { state: 'Maryland', county: 'Prince Georges', lat: 38.8462, lng: -76.8517 },
  '24510': { state: 'Maryland', county: 'Baltimore City', lat: 39.2904, lng: -76.6122 },

  // Minnesota counties (sample)
  '27053': { state: 'Minnesota', county: 'Hennepin', lat: 44.9778, lng: -93.2650 },
  '27123': { state: 'Minnesota', county: 'Ramsey', lat: 44.9537, lng: -93.0900 },

  // Colorado counties (sample)
  '08001': { state: 'Colorado', county: 'Adams', lat: 39.8739, lng: -104.3294 },
  '08005': { state: 'Colorado', county: 'Arapahoe', lat: 39.6503, lng: -104.3294 },
  '08031': { state: 'Colorado', county: 'Denver', lat: 39.7392, lng: -104.9903 },
  '08035': { state: 'Colorado', county: 'Douglas', lat: 39.3347, lng: -104.8619 },
  '08059': { state: 'Colorado', county: 'Jefferson', lat: 39.5501, lng: -105.2705 },

  // South Carolina counties (sample)
  '45019': { state: 'South Carolina', county: 'Charleston', lat: 32.7765, lng: -79.9311 },
  '45045': { state: 'South Carolina', county: 'Greenville', lat: 34.8526, lng: -82.3940 },
  '45079': { state: 'South Carolina', county: 'Richland', lat: 34.0007, lng: -80.8431 },

  // Alabama counties (sample)
  '01073': { state: 'Alabama', county: 'Jefferson', lat: 33.5186, lng: -86.8104 },

  // Louisiana counties (sample)
  '22051': { state: 'Louisiana', county: 'Jefferson', lat: 29.9511, lng: -90.0715 },
  '22071': { state: 'Louisiana', county: 'Orleans', lat: 29.9511, lng: -90.0715 },

  // Kentucky counties (sample)
  '21111': { state: 'Kentucky', county: 'Jefferson', lat: 38.2527, lng: -85.7585 },

  // Oregon counties (sample)
  '41005': { state: 'Oregon', county: 'Clackamas', lat: 45.4215, lng: -122.4058 },
  '41051': { state: 'Oregon', county: 'Multnomah', lat: 45.5152, lng: -122.6784 },
  '41067': { state: 'Oregon', county: 'Washington', lat: 45.5370, lng: -122.9897 },

  // Oklahoma counties (sample)
  '40109': { state: 'Oklahoma', county: 'Oklahoma', lat: 35.4676, lng: -97.5164 },
  '40143': { state: 'Oklahoma', county: 'Tulsa', lat: 36.1540, lng: -95.9928 },

  // Connecticut counties (sample)
  '09001': { state: 'Connecticut', county: 'Fairfield', lat: 41.2565, lng: -73.3709 },
  '09003': { state: 'Connecticut', county: 'Hartford', lat: 41.7658, lng: -72.6734 },
  '09009': { state: 'Connecticut', county: 'New Haven', lat: 41.3083, lng: -72.9279 },

  // Iowa counties (sample)
  '19153': { state: 'Iowa', county: 'Polk', lat: 41.5868, lng: -93.6250 },

  // Utah counties (sample)
  '49035': { state: 'Utah', county: 'Salt Lake', lat: 40.7608, lng: -111.8910 },

  // Nevada counties (sample)
  '32003': { state: 'Nevada', county: 'Clark', lat: 36.1699, lng: -115.1398 },

  // Arkansas counties (sample)
  '05119': { state: 'Arkansas', county: 'Pulaski', lat: 34.7465, lng: -92.2896 },

  // Mississippi counties (sample)
  '28049': { state: 'Mississippi', county: 'Hinds', lat: 32.2988, lng: -90.1848 },

  // Kansas counties (sample)
  '20091': { state: 'Kansas', county: 'Johnson', lat: 38.9042, lng: -94.7382 },
  '20173': { state: 'Kansas', county: 'Sedgwick', lat: 37.6872, lng: -97.3301 },

  // New Mexico counties (sample)
  '35001': { state: 'New Mexico', county: 'Bernalillo', lat: 35.0844, lng: -106.6504 },

  // Nebraska counties (sample)
  '31055': { state: 'Nebraska', county: 'Douglas', lat: 41.2565, lng: -96.0103 },

  // West Virginia counties (sample)
  '54039': { state: 'West Virginia', county: 'Kanawha', lat: 38.3498, lng: -81.6326 },

  // Idaho counties (sample)
  '16001': { state: 'Idaho', county: 'Ada', lat: 43.6150, lng: -116.2023 },

  // Hawaii counties (sample)
  '15003': { state: 'Hawaii', county: 'Honolulu', lat: 21.3099, lng: -157.8581 },

  // New Hampshire counties (sample)
  '33011': { state: 'New Hampshire', county: 'Hillsborough', lat: 42.9956, lng: -71.6886 },

  // Maine counties (sample)
  '23005': { state: 'Maine', county: 'Cumberland', lat: 43.6591, lng: -70.2568 },

  // Rhode Island counties (sample)
  '44007': { state: 'Rhode Island', county: 'Providence', lat: 41.8240, lng: -71.4128 },

  // Montana counties (sample)
  '30111': { state: 'Montana', county: 'Yellowstone', lat: 45.7833, lng: -108.5007 },

  // Delaware counties (sample)
  '10003': { state: 'Delaware', county: 'New Castle', lat: 39.5296, lng: -75.5277 },

  // South Dakota counties (sample)
  '46099': { state: 'South Dakota', county: 'Minnehaha', lat: 43.5460, lng: -96.7313 },

  // North Dakota counties (sample)
  '38017': { state: 'North Dakota', county: 'Cass', lat: 46.8772, lng: -97.0329 },

  // Alaska counties (sample)
  '02020': { state: 'Alaska', county: 'Anchorage', lat: 61.2181, lng: -149.9003 },

  // Vermont counties (sample)
  '50007': { state: 'Vermont', county: 'Chittenden', lat: 44.4759, lng: -73.2121 },

  // Wyoming counties (sample)
  '56025': { state: 'Wyoming', county: 'Natrona', lat: 42.8666, lng: -106.3131 },
};

/**
 * Geocodes a FIPS code to geographic coordinates
 * @param fipsCode - 5-digit FIPS code
 * @returns Location data or null if FIPS code not found
 */
export function geocodeFIPS(fipsCode: string): FIPSLocation | null {
  const location = FIPS_COORDINATES[fipsCode];
  if (!location) {
    return null;
  }

  return {
    fipsCode,
    ...location,
  };
}

/**
 * Geocodes multiple FIPS codes
 * @param fipsCodes - Array of 5-digit FIPS codes
 * @returns Array of location data (unknown FIPS codes are filtered out)
 */
export function geocodeFIPSBatch(fipsCodes: string[]): FIPSLocation[] {
  return fipsCodes
    .map(geocodeFIPS)
    .filter((location): location is FIPSLocation => location !== null);
}

/**
 * Checks if a FIPS code is supported
 * @param fipsCode - 5-digit FIPS code
 * @returns True if FIPS code is in the database
 */
export function isFIPSSupported(fipsCode: string): boolean {
  return fipsCode in FIPS_COORDINATES;
}

/**
 * Gets all supported FIPS codes
 * @returns Array of all supported FIPS codes
 */
export function getSupportedFIPSCodes(): string[] {
  return Object.keys(FIPS_COORDINATES);
}

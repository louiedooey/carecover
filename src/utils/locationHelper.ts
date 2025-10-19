import { HealthcareFacility, getNearestFacilities } from '../data/singaporeHealthcare';

export interface LocationInfo {
  region: 'east' | 'west' | 'north' | 'south' | 'central';
  area: string;
  coordinates?: { lat: number; lng: number };
}

// Common Singapore locations and their regions
const LOCATION_MAPPINGS: Record<string, LocationInfo> = {
  // East Region
  'east coast park': { region: 'east', area: 'East Coast Park' },
  'bedok': { region: 'east', area: 'Bedok' },
  'tampines': { region: 'east', area: 'Tampines' },
  'pasir ris': { region: 'east', area: 'Pasir Ris' },
  'changi': { region: 'east', area: 'Changi' },
  'marine parade': { region: 'east', area: 'Marine Parade' },
  'katong': { region: 'east', area: 'Katong' },
  'joo chiat': { region: 'east', area: 'Joo Chiat' },
  
  // West Region
  'jurong': { region: 'west', area: 'Jurong' },
  'jurong east': { region: 'west', area: 'Jurong East' },
  'jurong west': { region: 'west', area: 'Jurong West' },
  'clementi': { region: 'west', area: 'Clementi' },
  'bukit batok': { region: 'west', area: 'Bukit Batok' },
  'bukit panjang': { region: 'west', area: 'Bukit Panjang' },
  'choa chu kang': { region: 'west', area: 'Choa Chu Kang' },
  'boon lay': { region: 'west', area: 'Boon Lay' },
  'pioneer': { region: 'west', area: 'Pioneer' },
  'tuas': { region: 'west', area: 'Tuas' },
  
  // North Region
  'woodlands': { region: 'north', area: 'Woodlands' },
  'sembawang': { region: 'north', area: 'Sembawang' },
  'yishun': { region: 'north', area: 'Yishun' },
  'ang mo kio': { region: 'north', area: 'Ang Mo Kio' },
  'bishan': { region: 'north', area: 'Bishan' },
  'toa payoh': { region: 'north', area: 'Toa Payoh' },
  'serangoon': { region: 'north', area: 'Serangoon' },
  'punggol': { region: 'north', area: 'Punggol' },
  'sengkang': { region: 'north', area: 'Sengkang' },
  'hougang': { region: 'north', area: 'Hougang' },
  
  // South Region
  'sentosa': { region: 'south', area: 'Sentosa' },
  'harbourfront': { region: 'south', area: 'Harbourfront' },
  'telok blangah': { region: 'south', area: 'Telok Blangah' },
  'alexandra': { region: 'south', area: 'Alexandra' },
  'queenstown': { region: 'south', area: 'Queenstown' },
  'redhill': { region: 'south', area: 'Redhill' },
  'tiong bahru': { region: 'south', area: 'Tiong Bahru' },
  'mount faber': { region: 'south', area: 'Mount Faber' },
  
  // Central Region
  'orchard': { region: 'central', area: 'Orchard' },
  'marina bay': { region: 'central', area: 'Marina Bay' },
  'raffles place': { region: 'central', area: 'Raffles Place' },
  'city hall': { region: 'central', area: 'City Hall' },
  'bugis': { region: 'central', area: 'Bugis' },
  'little india': { region: 'central', area: 'Little India' },
  'chinatown': { region: 'central', area: 'Chinatown' },
  'clarke quay': { region: 'central', area: 'Clarke Quay' },
  'robertson quay': { region: 'central', area: 'Robertson Quay' },
  'novena': { region: 'central', area: 'Novena' },
  'newton': { region: 'central', area: 'Newton' },
  'dhoby ghaut': { region: 'central', area: 'Dhoby Ghaut' },
  'somerset': { region: 'central', area: 'Somerset' },
  'outram': { region: 'central', area: 'Outram' },
  'tanjong pagar': { region: 'central', area: 'Tanjong Pagar' },
  'lavender': { region: 'central', area: 'Lavender' },
  'kallang': { region: 'central', area: 'Kallang' },
  'geylang': { region: 'central', area: 'Geylang' },
  'aljunied': { region: 'central', area: 'Aljunied' },
  'payar lebar': { region: 'central', area: 'Paya Lebar' },
  'eunos': { region: 'central', area: 'Eunos' },
  'kembangan': { region: 'central', area: 'Kembangan' },
  'simei': { region: 'central', area: 'Simei' }
};

export function parseLocationFromText(text: string): LocationInfo | null {
  const lowerText = text.toLowerCase();
  
  // Direct mapping lookup
  for (const [location, info] of Object.entries(LOCATION_MAPPINGS)) {
    if (lowerText.includes(location)) {
      return info;
    }
  }
  
  // Try to extract region from common patterns
  const regionPatterns = {
    east: ['east', 'eastern'],
    west: ['west', 'western'],
    north: ['north', 'northern'],
    south: ['south', 'southern'],
    central: ['central', 'downtown', 'cbd', 'city']
  };
  
  for (const [region, patterns] of Object.entries(regionPatterns)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return { region: region as any, area: `${pattern} region` };
      }
    }
  }
  
  return null;
}

export function getHealthcareOptionsByLocation(
  locationText: string, 
  hasEmergency: boolean = false
): HealthcareFacility[] {
  const location = parseLocationFromText(locationText);
  
  if (!location) {
    // If no specific location found, return all emergency facilities
    return getNearestFacilities('central', hasEmergency);
  }
  
  return getNearestFacilities(location.region, hasEmergency);
}

export function formatLocationForDisplay(location: LocationInfo): string {
  return `${location.area} (${location.region.charAt(0).toUpperCase() + location.region.slice(1)} Region)`;
}

export function getDistanceEstimate(fromLocation: string, toFacility: HealthcareFacility): string {
  // Simple distance estimation based on region
  const fromLocationInfo = parseLocationFromText(fromLocation);
  
  if (!fromLocationInfo) {
    return 'Distance unknown';
  }
  
  if (fromLocationInfo.region === toFacility.region) {
    return 'Nearby (same region)';
  }
  
  // Cross-region distances (rough estimates)
  const crossRegionDistances: Record<string, string> = {
    'east-west': '15-25 km',
    'east-north': '10-20 km',
    'east-south': '5-15 km',
    'east-central': '5-15 km',
    'west-north': '10-20 km',
    'west-south': '15-25 km',
    'west-central': '10-20 km',
    'north-south': '15-25 km',
    'north-central': '5-15 km',
    'south-central': '5-15 km'
  };
  
  const distanceKey = [fromLocationInfo.region, toFacility.region].sort().join('-');
  return crossRegionDistances[distanceKey] || '10-20 km';
}

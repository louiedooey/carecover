import { HealthcareFacility } from '../data/singaporeHealthcare';

export interface CostResearchResult {
  procedure: string;
  costRange: {
    min: number;
    max: number;
    currency: string;
  };
  source: string;
  lastUpdated: Date;
  notes?: string;
}

export interface CostCache {
  [key: string]: CostResearchResult;
}

// Cache for cost research results
const costCache: CostCache = {};

// Predefined cost ranges for common procedures in Singapore
const PREDEFINED_COSTS: Record<string, CostResearchResult> = {
  'emergency_visit': {
    procedure: 'Emergency Department Visit',
    costRange: { min: 50, max: 500, currency: 'SGD' },
    source: 'Singapore Ministry of Health',
    lastUpdated: new Date('2024-01-01'),
    notes: 'Varies by hospital type and severity'
  },
  'gp_consultation': {
    procedure: 'General Practitioner Consultation',
    costRange: { min: 20, max: 120, currency: 'SGD' },
    source: 'Singapore Medical Association',
    lastUpdated: new Date('2024-01-01'),
    notes: 'Private GP rates'
  },
  'specialist_consultation': {
    procedure: 'Specialist Consultation',
    costRange: { min: 100, max: 300, currency: 'SGD' },
    source: 'Singapore Medical Association',
    lastUpdated: new Date('2024-01-01'),
    notes: 'First consultation rates'
  },
  'x_ray': {
    procedure: 'X-Ray',
    costRange: { min: 50, max: 150, currency: 'SGD' },
    source: 'Singapore Ministry of Health',
    lastUpdated: new Date('2024-01-01'),
    notes: 'Per body part'
  },
  'mri': {
    procedure: 'MRI Scan',
    costRange: { min: 400, max: 1200, currency: 'SGD' },
    source: 'Singapore Ministry of Health',
    lastUpdated: new Date('2024-01-01'),
    notes: 'Per body part'
  },
  'ct_scan': {
    procedure: 'CT Scan',
    costRange: { min: 200, max: 800, currency: 'SGD' },
    source: 'Singapore Ministry of Health',
    lastUpdated: new Date('2024-01-01'),
    notes: 'Per body part'
  },
  'blood_test': {
    procedure: 'Blood Test',
    costRange: { min: 20, max: 100, currency: 'SGD' },
    source: 'Singapore Ministry of Health',
    lastUpdated: new Date('2024-01-01'),
    notes: 'Basic panel'
  },
  'ultrasound': {
    procedure: 'Ultrasound',
    costRange: { min: 80, max: 200, currency: 'SGD' },
    source: 'Singapore Ministry of Health',
    lastUpdated: new Date('2024-01-01'),
    notes: 'Per body part'
  }
};

export async function researchMedicalCosts(
  procedure: string,
  facilityType?: 'hospital' | 'polyclinic' | 'gp' | 'specialist'
): Promise<CostResearchResult> {
  const cacheKey = `${procedure}_${facilityType || 'general'}`.toLowerCase();
  
  // Check cache first
  if (costCache[cacheKey]) {
    const cached = costCache[cacheKey];
    // Return cached result if less than 7 days old
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (cached.lastUpdated > sevenDaysAgo) {
      return cached;
    }
  }
  
  // Check predefined costs
  const predefinedKey = procedure.toLowerCase().replace(/\s+/g, '_');
  if (PREDEFINED_COSTS[predefinedKey]) {
    const result = PREDEFINED_COSTS[predefinedKey];
    costCache[cacheKey] = result;
    return result;
  }
  
  // Try to find similar predefined procedure
  const similarProcedure = findSimilarProcedure(procedure);
  if (similarProcedure) {
    const result = PREDEFINED_COSTS[similarProcedure];
    costCache[cacheKey] = result;
    return result;
  }
  
  // If no predefined cost found, return a generic estimate
  const genericEstimate = generateGenericEstimate(procedure, facilityType);
  costCache[cacheKey] = genericEstimate;
  return genericEstimate;
}

function findSimilarProcedure(procedure: string): string | null {
  const procedureLower = procedure.toLowerCase();
  
  // Map common procedure names to predefined keys
  const procedureMappings: Record<string, string> = {
    'emergency': 'emergency_visit',
    'a&e': 'emergency_visit',
    'accident': 'emergency_visit',
    'trauma': 'emergency_visit',
    'consultation': 'gp_consultation',
    'doctor': 'gp_consultation',
    'gp': 'gp_consultation',
    'specialist': 'specialist_consultation',
    'scan': 'ct_scan',
    'imaging': 'ct_scan',
    'xray': 'x_ray',
    'x-ray': 'x_ray',
    'mri': 'mri',
    'ultrasound': 'ultrasound',
    'blood': 'blood_test',
    'lab': 'blood_test',
    'test': 'blood_test'
  };
  
  for (const [keyword, predefinedKey] of Object.entries(procedureMappings)) {
    if (procedureLower.includes(keyword)) {
      return predefinedKey;
    }
  }
  
  return null;
}

function generateGenericEstimate(
  procedure: string,
  facilityType?: string
): CostResearchResult {
  // Base estimates by facility type
  const baseEstimates = {
    hospital: { min: 100, max: 500 },
    polyclinic: { min: 15, max: 50 },
    gp: { min: 30, max: 120 },
    specialist: { min: 150, max: 400 }
  };
  
  const facilityEstimate = facilityType ? baseEstimates[facilityType as keyof typeof baseEstimates] : baseEstimates.hospital;
  
  return {
    procedure,
    costRange: {
      min: facilityEstimate.min,
      max: facilityEstimate.max,
      currency: 'SGD'
    },
    source: 'CareCover Estimate',
    lastUpdated: new Date(),
    notes: 'Estimated based on facility type and procedure category'
  };
}

export function getCostEstimateForFacility(
  facility: HealthcareFacility,
  procedure: string
): CostResearchResult {
  const procedureLower = procedure.toLowerCase();
  
  // Use facility's predefined cost ranges
  if (procedureLower.includes('emergency') || procedureLower.includes('a&e')) {
    return {
      procedure: 'Emergency Visit',
      costRange: facility.costRanges.emergency,
      currency: 'SGD',
      source: facility.name,
      lastUpdated: new Date(),
      notes: `Emergency visit at ${facility.name}`
    };
  }
  
  if (procedureLower.includes('consultation') || procedureLower.includes('gp')) {
    return {
      procedure: 'Consultation',
      costRange: facility.costRanges.consultation,
      currency: 'SGD',
      source: facility.name,
      lastUpdated: new Date(),
      notes: `Consultation at ${facility.name}`
    };
  }
  
  if (procedureLower.includes('specialist')) {
    return {
      procedure: 'Specialist Consultation',
      costRange: facility.costRanges.specialist,
      currency: 'SGD',
      source: facility.name,
      lastUpdated: new Date(),
      notes: `Specialist consultation at ${facility.name}`
    };
  }
  
  // Default to consultation cost
  return {
    procedure: 'Medical Consultation',
    costRange: facility.costRanges.consultation,
    currency: 'SGD',
    source: facility.name,
    lastUpdated: new Date(),
    notes: `Medical consultation at ${facility.name}`
  };
}

export function formatCostRange(costRange: { min: number; max: number; currency: string }): string {
  if (costRange.min === costRange.max) {
    return `${costRange.currency} ${costRange.min}`;
  }
  return `${costRange.currency} ${costRange.min} - ${costRange.max}`;
}

export function getCostComparison(
  facilities: HealthcareFacility[],
  procedure: string
): Array<{
  facility: HealthcareFacility;
  cost: CostResearchResult;
  formattedCost: string;
}> {
  return facilities.map(facility => {
    const cost = getCostEstimateForFacility(facility, procedure);
    return {
      facility,
      cost,
      formattedCost: formatCostRange(cost.costRange)
    };
  }).sort((a, b) => a.cost.costRange.min - b.cost.costRange.min);
}

export function clearCostCache(): void {
  Object.keys(costCache).forEach(key => delete costCache[key]);
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: Object.keys(costCache).length,
    keys: Object.keys(costCache)
  };
}

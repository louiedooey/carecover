import { ExtractedDocument, ClaimHistory } from '../types';
import { HealthcareFacility } from '../data/singaporeHealthcare';

export interface CoverageEstimate {
  percentage: number;
  deductible: number;
  coPay: number;
  isPanelProvider: boolean;
  annualLimit: number;
  remainingLimit: number;
  waitingPeriod: number;
  conditions: string[];
  explanation: string;
}

export interface CoverageConditions {
  hasWaitingPeriod: boolean;
  waitingPeriodDays: number;
  hasRecentClaims: boolean;
  recentClaimCount: number;
  isPanelProvider: boolean;
  hasSubLimits: boolean;
  subLimitAmount?: number;
  requiresPreAuth: boolean;
  hasDeductible: boolean;
  deductibleAmount: number;
}

export function calculateCoverage(
  facility: HealthcareFacility,
  insuranceDocuments: ExtractedDocument[],
  claimHistory: ClaimHistory[],
  treatmentType: 'emergency' | 'consultation' | 'specialist'
): CoverageEstimate {
  // Default coverage for public facilities
  if (facility.type === 'polyclinic') {
    return {
      percentage: 100,
      deductible: 0,
      coPay: 0,
      isPanelProvider: true,
      annualLimit: 0,
      remainingLimit: 0,
      waitingPeriod: 0,
      conditions: [],
      explanation: 'Fully subsidized at polyclinics with Medisave/Medishield Life'
    };
  }

  // Parse insurance documents for coverage details
  const coverageInfo = parseInsuranceCoverage(insuranceDocuments, treatmentType);
  const conditions = checkCoverageConditions(insuranceDocuments, claimHistory, facility);
  
  // Calculate coverage based on facility type and insurance
  let percentage = 0;
  let deductible = 0;
  let coPay = 0;
  let annualLimit = 0;
  let remainingLimit = 0;
  let waitingPeriod = 0;
  const conditionList: string[] = [];

  // Check if facility is panel provider
  const isPanelProvider = facility.insurancePanels.some(panel => 
    coverageInfo.panelProviders.includes(panel)
  );

  if (isPanelProvider) {
    percentage = coverageInfo.panelCoverage;
    deductible = coverageInfo.deductible;
    coPay = coverageInfo.coPay;
    annualLimit = coverageInfo.annualLimit;
    remainingLimit = Math.max(0, annualLimit - getUsedLimit(claimHistory));
    waitingPeriod = coverageInfo.waitingPeriod;
  } else {
    percentage = coverageInfo.nonPanelCoverage;
    deductible = coverageInfo.deductible * 1.5; // Higher deductible for non-panel
    coPay = coverageInfo.coPay * 2; // Higher co-pay for non-panel
    annualLimit = coverageInfo.annualLimit;
    remainingLimit = Math.max(0, annualLimit - getUsedLimit(claimHistory));
    waitingPeriod = coverageInfo.waitingPeriod;
    conditionList.push('Non-panel provider - reduced coverage');
  }

  // Apply conditions
  if (conditions.hasWaitingPeriod && conditions.waitingPeriodDays > 0) {
    conditionList.push(`Waiting period: ${conditions.waitingPeriodDays} days`);
    if (conditions.waitingPeriodDays > 30) {
      percentage = 0; // No coverage during waiting period
    }
  }

  if (conditions.hasRecentClaims && conditions.recentClaimCount > 3) {
    conditionList.push('Multiple recent claims - may affect coverage');
    percentage = Math.max(0, percentage - 10); // Reduce coverage by 10%
  }

  if (conditions.hasSubLimits && conditions.subLimitAmount) {
    conditionList.push(`Sub-limit applies: $${conditions.subLimitAmount}`);
  }

  if (conditions.requiresPreAuth) {
    conditionList.push('Pre-authorization required');
  }

  // Generate explanation
  const explanation = generateCoverageExplanation(
    percentage,
    deductible,
    coPay,
    isPanelProvider,
    conditions,
    facility
  );

  return {
    percentage,
    deductible,
    coPay,
    isPanelProvider,
    annualLimit,
    remainingLimit,
    waitingPeriod,
    conditions: conditionList,
    explanation
  };
}

function parseInsuranceCoverage(
  documents: ExtractedDocument[],
  _treatmentType: string
): {
  panelCoverage: number;
  nonPanelCoverage: number;
  deductible: number;
  coPay: number;
  annualLimit: number;
  waitingPeriod: number;
  panelProviders: string[];
} {
  // Default values
  let panelCoverage = 80;
  let nonPanelCoverage = 60;
  let deductible = 100;
  let coPay = 20;
  let annualLimit = 10000;
  let waitingPeriod = 0;
  const panelProviders: string[] = [];

  // Parse documents for coverage information
  for (const doc of documents) {
    const text = doc.extractedText.toLowerCase();
    
    // Look for coverage percentages
    const coverageMatch = text.match(/(\d+)%?\s*(?:coverage|reimbursement)/g);
    if (coverageMatch) {
      const percentages = coverageMatch.map(match => 
        parseInt(match.replace(/[^\d]/g, ''))
      );
      if (percentages.length > 0) {
        panelCoverage = Math.max(...percentages);
        nonPanelCoverage = Math.max(0, panelCoverage - 20);
      }
    }

    // Look for deductibles
    const deductibleMatch = text.match(/deductible[:\s]*\$?(\d+)/i);
    if (deductibleMatch) {
      deductible = parseInt(deductibleMatch[1]);
    }

    // Look for co-pays
    const coPayMatch = text.match(/co-?pay[:\s]*\$?(\d+)/i);
    if (coPayMatch) {
      coPay = parseInt(coPayMatch[1]);
    }

    // Look for annual limits
    const limitMatch = text.match(/annual\s*limit[:\s]*\$?(\d+)/i);
    if (limitMatch) {
      annualLimit = parseInt(limitMatch[1]);
    }

    // Look for waiting periods
    const waitingMatch = text.match(/waiting\s*period[:\s]*(\d+)\s*days?/i);
    if (waitingMatch) {
      waitingPeriod = parseInt(waitingMatch[1]);
    }

    // Look for panel providers
    const panelMatch = text.match(/panel\s*providers?[:\s]*([^.]+)/i);
    if (panelMatch) {
      const providers = panelMatch[1].split(/[,;]/).map(p => p.trim());
      panelProviders.push(...providers);
    }
  }

  return {
    panelCoverage,
    nonPanelCoverage,
    deductible,
    coPay,
    annualLimit,
    waitingPeriod,
    panelProviders
  };
}

function checkCoverageConditions(
  documents: ExtractedDocument[],
  claimHistory: ClaimHistory[],
  facility: HealthcareFacility
): CoverageConditions {
  const conditions: CoverageConditions = {
    hasWaitingPeriod: false,
    waitingPeriodDays: 0,
    hasRecentClaims: false,
    recentClaimCount: 0,
    isPanelProvider: false,
    hasSubLimits: false,
    requiresPreAuth: false,
    hasDeductible: false,
    deductibleAmount: 0
  };

  // Check for waiting periods
  for (const doc of documents) {
    const text = doc.extractedText.toLowerCase();
    if (text.includes('waiting period')) {
      conditions.hasWaitingPeriod = true;
      const match = text.match(/waiting\s*period[:\s]*(\d+)\s*days?/i);
      if (match) {
        conditions.waitingPeriodDays = parseInt(match[1]);
      }
    }
  }

  // Check recent claims (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentClaims = claimHistory.filter(claim => 
    new Date(claim.date) > thirtyDaysAgo
  );
  
  conditions.hasRecentClaims = recentClaims.length > 0;
  conditions.recentClaimCount = recentClaims.length;

  // Check if facility is panel provider
  conditions.isPanelProvider = facility.insurancePanels.length > 0;

  // Check for sub-limits and pre-authorization requirements
  for (const doc of documents) {
    const text = doc.extractedText.toLowerCase();
    
    if (text.includes('sub-limit') || text.includes('sublimit')) {
      conditions.hasSubLimits = true;
      const match = text.match(/sub-?limit[:\s]*\$?(\d+)/i);
      if (match) {
        conditions.subLimitAmount = parseInt(match[1]);
      }
    }
    
    if (text.includes('pre-authorization') || text.includes('preauth')) {
      conditions.requiresPreAuth = true;
    }
    
    if (text.includes('deductible')) {
      conditions.hasDeductible = true;
      const match = text.match(/deductible[:\s]*\$?(\d+)/i);
      if (match) {
        conditions.deductibleAmount = parseInt(match[1]);
      }
    }
  }

  return conditions;
}

function getUsedLimit(claimHistory: ClaimHistory[]): number {
  const currentYear = new Date().getFullYear();
  return claimHistory
    .filter(claim => new Date(claim.date).getFullYear() === currentYear)
    .reduce((total, claim) => total + claim.amount, 0);
}

function generateCoverageExplanation(
  percentage: number,
  deductible: number,
  coPay: number,
  isPanelProvider: boolean,
  conditions: CoverageConditions,
  _facility: HealthcareFacility
): string {
  const parts: string[] = [];
  
  if (percentage === 0) {
    parts.push('No coverage available');
  } else {
    parts.push(`${percentage}% coverage`);
  }
  
  if (deductible > 0) {
    parts.push(`$${deductible} deductible`);
  }
  
  if (coPay > 0) {
    parts.push(`$${coPay} co-pay`);
  }
  
  if (isPanelProvider) {
    parts.push('Panel provider');
  } else {
    parts.push('Non-panel provider');
  }
  
  if (conditions.hasWaitingPeriod && conditions.waitingPeriodDays > 0) {
    parts.push(`${conditions.waitingPeriodDays}-day waiting period`);
  }
  
  if (conditions.requiresPreAuth) {
    parts.push('Pre-authorization required');
  }
  
  return parts.join(', ');
}

export function getCoverageSummary(
  facility: HealthcareFacility,
  insuranceDocuments: ExtractedDocument[],
  claimHistory: ClaimHistory[],
  treatmentType: 'emergency' | 'consultation' | 'specialist'
): string {
  const coverage = calculateCoverage(facility, insuranceDocuments, claimHistory, treatmentType);
  
  if (coverage.percentage === 0) {
    return 'No coverage available';
  }
  
  const costRange = facility.costRanges.emergency || facility.costRanges.consultation;
  const estimatedCost = (costRange.min + costRange.max) / 2;
  const coveredAmount = (estimatedCost - coverage.deductible) * (coverage.percentage / 100);
  const outOfPocket = estimatedCost - coveredAmount + coverage.coPay;
  
  return `Estimated out-of-pocket: $${Math.round(outOfPocket)} (${coverage.percentage}% coverage)`;
}

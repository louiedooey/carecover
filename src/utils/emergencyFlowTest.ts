// Emergency Flow Integration Test
// This file contains test utilities to verify the emergency flow implementation

import { HealthcareFacility, getNearestFacilities } from '../data/singaporeHealthcare';
import { parseLocationFromText, getHealthcareOptionsByLocation } from './locationHelper';
import { calculateCoverage } from './coverageCalculator';
import { createTreatmentPreparation } from './treatmentPrep';
import { detectEmergencyFromMessage, getSeverityFromSymptoms } from './useEmergencyFlow';
import { Message } from '../types';

// Test data
const testInsuranceDocuments = [
  {
    id: 'test-insurance-1',
    fileName: 'AIA HealthShield Policy.pdf',
    extractedText: 'AIA HealthShield Gold Max - Panel coverage 80%, Non-panel 60%, Deductible $100, Co-pay $20, Annual limit $10,000',
    category: 'insurance' as const,
    parentTitle: 'AIA HealthShield Gold Max',
    extractedAt: new Date(),
    summary: 'Comprehensive health insurance with good coverage',
    keyPoints: ['80% panel coverage', '$100 deductible', '$20 co-pay']
  }
];

const testMedicalDocuments = [
  {
    id: 'test-medical-1',
    fileName: 'Previous Injury Report.pdf',
    extractedText: 'Patient has history of knee injury from 2023, no current medications, no known allergies',
    category: 'medical' as const,
    parentTitle: 'Previous Injury Report',
    extractedAt: new Date(),
    summary: 'Previous knee injury history',
    keyPoints: ['Knee injury 2023', 'No current medications', 'No allergies']
  }
];

const testClaimHistory = [
  {
    id: 'claim-1',
    date: new Date('2024-01-15'),
    amount: 150,
    provider: 'Mount Elizabeth Hospital',
    type: 'emergency' as const,
    status: 'approved' as const,
    description: 'Emergency visit for chest pain'
  }
];

// Test functions
export function testLocationParsing() {
  console.log('🧪 Testing location parsing...');
  
  const testLocations = [
    'I am at East Coast Park',
    'I am in Jurong East',
    'I am at Orchard Road',
    'I am in Woodlands'
  ];
  
  testLocations.forEach(location => {
    const parsed = parseLocationFromText(location);
    console.log(`📍 "${location}" → ${parsed ? `${parsed.area} (${parsed.region})` : 'Not found'}`);
  });
  
  return true;
}

export function testHealthcareOptions() {
  console.log('🧪 Testing healthcare options...');
  
  const testLocation = 'East Coast Park';
  const options = getHealthcareOptionsByLocation(testLocation, true);
  
  console.log(`🏥 Found ${options.length} emergency facilities near ${testLocation}:`);
  options.forEach(facility => {
    console.log(`  - ${facility.name} (${facility.type}) - ${facility.address}`);
  });
  
  return options.length > 0;
}

export function testCoverageCalculation() {
  console.log('🧪 Testing coverage calculation...');
  
  const testFacility: HealthcareFacility = {
    id: 'test-facility',
    name: 'Test Hospital',
    type: 'hospital',
    region: 'east',
    address: '123 Test Street',
    phone: '+65 1234 5678',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 150, max: 300 },
      emergency: { min: 200, max: 500 },
      specialist: { min: 200, max: 400 }
    },
    waitTime: {
      emergency: '1-2 hours',
      consultation: '30-60 minutes'
    },
    insurancePanels: ['AIA'],
    services: ['Emergency', 'General Medicine']
  };
  
  const coverage = calculateCoverage(
    testFacility,
    testInsuranceDocuments,
    testClaimHistory,
    'emergency'
  );
  
  console.log(`💰 Coverage for ${testFacility.name}:`);
  console.log(`  - Percentage: ${coverage.percentage}%`);
  console.log(`  - Deductible: $${coverage.deductible}`);
  console.log(`  - Co-pay: $${coverage.coPay}`);
  console.log(`  - Panel provider: ${coverage.isPanelProvider}`);
  console.log(`  - Explanation: ${coverage.explanation}`);
  
  return coverage.percentage > 0;
}

export function testTreatmentPreparation() {
  console.log('🧪 Testing treatment preparation...');
  
  const testMessages: Message[] = [
    {
      id: 'msg-1',
      content: 'I fell and hurt my knee at East Coast Park',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: 'msg-2',
      content: 'Pain level is 8, I cannot walk properly',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }
  ];
  
  const preparation = createTreatmentPreparation(
    testMessages,
    testMedicalDocuments,
    'emergency',
    true
  );
  
  console.log('📋 Treatment preparation generated:');
  console.log(`  - Severity: ${preparation.summary.severity}`);
  console.log(`  - Symptoms: ${preparation.summary.symptoms.join(', ')}`);
  console.log(`  - Required documents: ${preparation.documents.required.length}`);
  console.log(`  - Questions for doctor: ${preparation.questions.length}`);
  console.log(`  - Instructions: ${preparation.instructions.length}`);
  
  return preparation.summary.severity !== undefined;
}

export function testEmergencyDetection() {
  console.log('🧪 Testing emergency detection...');
  
  const testMessages: Message[] = [
    {
      id: 'msg-1',
      content: 'I fell and hurt my knee, pain level 8',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: 'msg-2',
      content: 'I have a headache',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }
  ];
  
  testMessages.forEach(message => {
    const detection = detectEmergencyFromMessage(message);
    const severity = getSeverityFromSymptoms(detection.symptoms, detection.painLevel);
    
    console.log(`🚨 Message: "${message.content}"`);
    console.log(`  - Is emergency: ${detection.isEmergency}`);
    console.log(`  - Symptoms: ${detection.symptoms.join(', ')}`);
    console.log(`  - Severity: ${severity}`);
  });
  
  return true;
}

export function runAllTests() {
  console.log('🚀 Running Emergency Flow Integration Tests...\n');
  
  const tests = [
    { name: 'Location Parsing', fn: testLocationParsing },
    { name: 'Healthcare Options', fn: testHealthcareOptions },
    { name: 'Coverage Calculation', fn: testCoverageCalculation },
    { name: 'Treatment Preparation', fn: testTreatmentPreparation },
    { name: 'Emergency Detection', fn: testEmergencyDetection }
  ];
  
  const results = tests.map(test => {
    try {
      const result = test.fn();
      console.log(`✅ ${test.name}: ${result ? 'PASSED' : 'FAILED'}\n`);
      return { name: test.name, passed: result };
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error}\n`);
      return { name: test.name, passed: false };
    }
  });
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  return results;
}

// Export for use in development
export default {
  testLocationParsing,
  testHealthcareOptions,
  testCoverageCalculation,
  testTreatmentPreparation,
  testEmergencyDetection,
  runAllTests
};

export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'polyclinic' | 'gp' | 'specialist';
  region: 'east' | 'west' | 'north' | 'south' | 'central';
  address: string;
  phone: string;
  operatingHours: {
    weekdays: string;
    weekends: string;
    emergency: string;
  };
  hasAandE: boolean;
  hasEmergency: boolean;
  costRanges: {
    consultation: { min: number; max: number };
    emergency: { min: number; max: number };
    specialist: { min: number; max: number };
  };
  waitTime: {
    emergency: string;
    consultation: string;
  };
  insurancePanels: string[];
  services: string[];
}

export const SINGAPORE_HEALTHCARE_FACILITIES: HealthcareFacility[] = [
  // East Region
  {
    id: 'parkway-east',
    name: 'Parkway East Hospital',
    type: 'hospital',
    region: 'east',
    address: '321 Joo Chiat Place, Singapore 427990',
    phone: '+65 6340 8666',
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
      emergency: '1-3 hours',
      consultation: '30-60 minutes'
    },
    insurancePanels: ['AIA', 'Prudential', 'Great Eastern', 'NTUC Income'],
    services: ['Emergency', 'General Surgery', 'Orthopedics', 'Radiology']
  },
  {
    id: 'bedok-polyclinic',
    name: 'Bedok Polyclinic',
    type: 'polyclinic',
    region: 'east',
    address: '11 Bedok North Street 1, Singapore 469662',
    phone: '+65 6243 6688',
    operatingHours: {
      weekdays: '8:00 AM - 5:30 PM',
      weekends: '8:00 AM - 1:00 PM',
      emergency: 'Closed'
    },
    hasAandE: false,
    hasEmergency: false,
    costRanges: {
      consultation: { min: 15, max: 30 },
      emergency: { min: 0, max: 0 },
      specialist: { min: 25, max: 50 }
    },
    waitTime: {
      emergency: 'N/A',
      consultation: '1-3 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life'],
    services: ['General Consultation', 'Chronic Disease Management', 'Vaccination']
  },
  {
    id: 'east-shore',
    name: 'East Shore Hospital',
    type: 'hospital',
    region: 'east',
    address: '319 Joo Chiat Place, Singapore 427989',
    phone: '+65 6344 7588',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 120, max: 250 },
      emergency: { min: 180, max: 400 },
      specialist: { min: 180, max: 350 }
    },
    waitTime: {
      emergency: '1-2 hours',
      consultation: '20-45 minutes'
    },
    insurancePanels: ['AIA', 'Prudential', 'Great Eastern', 'NTUC Income', 'Aviva'],
    services: ['Emergency', 'General Medicine', 'Orthopedics', 'Cardiology']
  },

  // West Region
  {
    id: 'jurong-east-polyclinic',
    name: 'Jurong East Polyclinic',
    type: 'polyclinic',
    region: 'west',
    address: '50 Jurong Gateway Road, Singapore 608549',
    phone: '+65 6355 3000',
    operatingHours: {
      weekdays: '8:00 AM - 5:30 PM',
      weekends: '8:00 AM - 1:00 PM',
      emergency: 'Closed'
    },
    hasAandE: false,
    hasEmergency: false,
    costRanges: {
      consultation: { min: 15, max: 30 },
      emergency: { min: 0, max: 0 },
      specialist: { min: 25, max: 50 }
    },
    waitTime: {
      emergency: 'N/A',
      consultation: '1-3 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life'],
    services: ['General Consultation', 'Chronic Disease Management', 'Vaccination']
  },
  {
    id: 'ng-teng-fong',
    name: 'Ng Teng Fong General Hospital',
    type: 'hospital',
    region: 'west',
    address: '1 Jurong East Street 21, Singapore 609606',
    phone: '+65 6716 2000',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 20, max: 50 },
      emergency: { min: 50, max: 150 },
      specialist: { min: 30, max: 80 }
    },
    waitTime: {
      emergency: '2-4 hours',
      consultation: '1-2 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life', 'AIA', 'Prudential'],
    services: ['Emergency', 'General Medicine', 'Surgery', 'Orthopedics', 'Cardiology']
  },

  // Central Region
  {
    id: 'singapore-general',
    name: 'Singapore General Hospital',
    type: 'hospital',
    region: 'central',
    address: 'Outram Road, Singapore 169608',
    phone: '+65 6222 3322',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 20, max: 50 },
      emergency: { min: 50, max: 150 },
      specialist: { min: 30, max: 80 }
    },
    waitTime: {
      emergency: '2-4 hours',
      consultation: '1-2 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life', 'AIA', 'Prudential', 'Great Eastern'],
    services: ['Emergency', 'Trauma', 'General Medicine', 'Surgery', 'Specialist Care']
  },
  {
    id: 'national-university',
    name: 'National University Hospital',
    type: 'hospital',
    region: 'central',
    address: '5 Lower Kent Ridge Road, Singapore 119074',
    phone: '+65 6779 5555',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 20, max: 50 },
      emergency: { min: 50, max: 150 },
      specialist: { min: 30, max: 80 }
    },
    waitTime: {
      emergency: '2-4 hours',
      consultation: '1-2 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life', 'AIA', 'Prudential', 'Great Eastern'],
    services: ['Emergency', 'General Medicine', 'Surgery', 'Pediatrics', 'Specialist Care']
  },
  {
    id: 'outram-polyclinic',
    name: 'Outram Polyclinic',
    type: 'polyclinic',
    region: 'central',
    address: '3 Second Hospital Avenue, Singapore 168937',
    phone: '+65 6435 3000',
    operatingHours: {
      weekdays: '8:00 AM - 5:30 PM',
      weekends: '8:00 AM - 1:00 PM',
      emergency: 'Closed'
    },
    hasAandE: false,
    hasEmergency: false,
    costRanges: {
      consultation: { min: 15, max: 30 },
      emergency: { min: 0, max: 0 },
      specialist: { min: 25, max: 50 }
    },
    waitTime: {
      emergency: 'N/A',
      consultation: '1-3 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life'],
    services: ['General Consultation', 'Chronic Disease Management', 'Vaccination']
  },

  // North Region
  {
    id: 'woodlands-polyclinic',
    name: 'Woodlands Polyclinic',
    type: 'polyclinic',
    region: 'north',
    address: '10 Woodlands Street 31, Singapore 738579',
    phone: '+65 6253 4455',
    operatingHours: {
      weekdays: '8:00 AM - 5:30 PM',
      weekends: '8:00 AM - 1:00 PM',
      emergency: 'Closed'
    },
    hasAandE: false,
    hasEmergency: false,
    costRanges: {
      consultation: { min: 15, max: 30 },
      emergency: { min: 0, max: 0 },
      specialist: { min: 25, max: 50 }
    },
    waitTime: {
      emergency: 'N/A',
      consultation: '1-3 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life'],
    services: ['General Consultation', 'Chronic Disease Management', 'Vaccination']
  },
  {
    id: 'khoo-teck-puat',
    name: 'Khoo Teck Puat Hospital',
    type: 'hospital',
    region: 'north',
    address: '90 Yishun Central, Singapore 768828',
    phone: '+65 6602 2000',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 20, max: 50 },
      emergency: { min: 50, max: 150 },
      specialist: { min: 30, max: 80 }
    },
    waitTime: {
      emergency: '2-4 hours',
      consultation: '1-2 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life', 'AIA', 'Prudential', 'Great Eastern'],
    services: ['Emergency', 'General Medicine', 'Surgery', 'Orthopedics', 'Cardiology']
  },

  // South Region
  {
    id: 'alexandra',
    name: 'Alexandra Hospital',
    type: 'hospital',
    region: 'south',
    address: '378 Alexandra Road, Singapore 159964',
    phone: '+65 6472 2000',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 20, max: 50 },
      emergency: { min: 50, max: 150 },
      specialist: { min: 30, max: 80 }
    },
    waitTime: {
      emergency: '2-4 hours',
      consultation: '1-2 hours'
    },
    insurancePanels: ['Medisave', 'Medishield Life', 'AIA', 'Prudential', 'Great Eastern'],
    services: ['Emergency', 'General Medicine', 'Surgery', 'Orthopedics', 'Rehabilitation']
  },

  // Private GP Clinics (sample)
  {
    id: 'raffles-medical-east',
    name: 'Raffles Medical - East Coast',
    type: 'gp',
    region: 'east',
    address: '1 Marine Parade Central, Singapore 449408',
    phone: '+65 6311 1111',
    operatingHours: {
      weekdays: '8:00 AM - 9:00 PM',
      weekends: '8:00 AM - 5:00 PM',
      emergency: 'Closed'
    },
    hasAandE: false,
    hasEmergency: false,
    costRanges: {
      consultation: { min: 50, max: 120 },
      emergency: { min: 0, max: 0 },
      specialist: { min: 0, max: 0 }
    },
    waitTime: {
      emergency: 'N/A',
      consultation: '15-30 minutes'
    },
    insurancePanels: ['AIA', 'Prudential', 'Great Eastern', 'NTUC Income', 'Aviva'],
    services: ['General Consultation', 'Vaccination', 'Health Screening']
  },
  {
    id: 'mount-elizabeth-orchard',
    name: 'Mount Elizabeth Hospital (Orchard)',
    type: 'hospital',
    region: 'central',
    address: '3 Mount Elizabeth, Singapore 228510',
    phone: '+65 6737 2666',
    operatingHours: {
      weekdays: '24/7',
      weekends: '24/7',
      emergency: '24/7'
    },
    hasAandE: true,
    hasEmergency: true,
    costRanges: {
      consultation: { min: 200, max: 400 },
      emergency: { min: 300, max: 600 },
      specialist: { min: 250, max: 500 }
    },
    waitTime: {
      emergency: '30-60 minutes',
      consultation: '15-30 minutes'
    },
    insurancePanels: ['AIA', 'Prudential', 'Great Eastern', 'NTUC Income', 'Aviva'],
    services: ['Emergency', 'General Medicine', 'Surgery', 'Specialist Care', 'Cardiology']
  }
];

export const FACILITY_TYPES = {
  hospital: 'Hospital',
  polyclinic: 'Polyclinic',
  gp: 'General Practice',
  specialist: 'Specialist Clinic'
} as const;

export const REGIONS = {
  east: 'East',
  west: 'West',
  north: 'North',
  south: 'South',
  central: 'Central'
} as const;

export function getFacilitiesByRegion(region: string): HealthcareFacility[] {
  return SINGAPORE_HEALTHCARE_FACILITIES.filter(facility => facility.region === region);
}

export function getFacilitiesByType(type: string): HealthcareFacility[] {
  return SINGAPORE_HEALTHCARE_FACILITIES.filter(facility => facility.type === type);
}

export function getEmergencyFacilities(): HealthcareFacility[] {
  return SINGAPORE_HEALTHCARE_FACILITIES.filter(facility => facility.hasAandE || facility.hasEmergency);
}

export function getFacilitiesByInsurance(insuranceProvider: string): HealthcareFacility[] {
  return SINGAPORE_HEALTHCARE_FACILITIES.filter(facility => 
    facility.insurancePanels.includes(insuranceProvider)
  );
}

export function getNearestFacilities(region: string, hasEmergency: boolean = false): HealthcareFacility[] {
  let facilities = getFacilitiesByRegion(region);
  
  if (hasEmergency) {
    facilities = facilities.filter(facility => facility.hasAandE || facility.hasEmergency);
  }
  
  // Sort by type priority: hospitals with A&E first, then other hospitals, then polyclinics, then GPs
  return facilities.sort((a, b) => {
    const typePriority = { hospital: 0, polyclinic: 1, gp: 2, specialist: 3 };
    const aPriority = typePriority[a.type];
    const bPriority = typePriority[b.type];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same type, prioritize those with emergency services
    if (a.hasAandE && !b.hasAandE) return -1;
    if (!a.hasAandE && b.hasAandE) return 1;
    
    return 0;
  });
}

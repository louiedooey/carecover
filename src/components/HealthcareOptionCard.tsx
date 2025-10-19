import React, { useState } from 'react';
import { Phone, MapPin, Clock, DollarSign, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { HealthcareFacility } from '../data/singaporeHealthcare';
import { CoverageEstimate } from '../utils/coverageCalculator';
import { formatCostRange } from '../utils/costResearch';
import CoverageInfoTooltip from './CoverageInfoTooltip';

interface HealthcareOptionCardProps {
  facility: HealthcareFacility;
  coverage: CoverageEstimate;
  procedure: string;
  isSelected?: boolean;
  onSelect?: (facility: HealthcareFacility) => void;
  onCall?: (phone: string) => void;
  onGetDirections?: (address: string) => void;
}

const HealthcareOptionCard: React.FC<HealthcareOptionCardProps> = ({
  facility,
  coverage,
  procedure,
  isSelected = false,
  onSelect,
  onCall,
  onGetDirections
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFacilityTypeColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'polyclinic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'gp':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'specialist':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCostRange = () => {
    if (procedure.toLowerCase().includes('emergency')) {
      return { ...facility.costRanges.emergency, currency: 'SGD' };
    }
    if (procedure.toLowerCase().includes('specialist')) {
      return { ...facility.costRanges.specialist, currency: 'SGD' };
    }
    return { ...facility.costRanges.consultation, currency: 'SGD' };
  };

  const costRange = getCostRange();
  const estimatedCost = (costRange.min + costRange.max) / 2;
  const coveredAmount = Math.max(0, (estimatedCost - coverage.deductible) * (coverage.percentage / 100));
  const outOfPocket = Math.max(0, estimatedCost - coveredAmount + coverage.coPay);

  return (
    <div className={`
      bg-white border-2 rounded-lg p-4 shadow-sm transition-all duration-200
      ${isSelected 
        ? 'border-carecover-blue shadow-md' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {facility.name}
            </h3>
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium border
              ${getFacilityTypeColor(facility.type)}
            `}>
              {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}
            </span>
            {facility.hasAandE && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                A&E
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-600 mb-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{facility.address}</span>
          </div>
        </div>
        
        {onSelect && (
          <button
            onClick={() => onSelect(facility)}
            className={`
              px-3 py-1 rounded text-xs font-medium transition-colors
              ${isSelected
                ? 'bg-carecover-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
        )}
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Cost */}
        <div className="flex items-center text-xs">
          <DollarSign className="w-3 h-3 mr-1 text-gray-500" />
          <div>
            <div className="text-gray-600">Est. Cost</div>
            <div className="font-medium text-gray-900">
              {formatCostRange(costRange)}
            </div>
          </div>
        </div>

        {/* Coverage */}
        <div className="flex items-center text-xs">
          <Shield className="w-3 h-3 mr-1 text-gray-500" />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Coverage</span>
              <CoverageInfoTooltip />
            </div>
            <div className={`font-medium ${getCoverageColor(coverage.percentage)}`}>
              {coverage.percentage}%
            </div>
          </div>
        </div>

        {/* Wait Time */}
        <div className="flex items-center text-xs">
          <Clock className="w-3 h-3 mr-1 text-gray-500" />
          <div>
            <div className="text-gray-600">Wait Time</div>
            <div className="font-medium text-gray-900">
              {facility.waitTime.emergency || facility.waitTime.consultation}
            </div>
          </div>
        </div>

        {/* Out of Pocket */}
        <div className="flex items-center text-xs">
          <DollarSign className="w-3 h-3 mr-1 text-gray-500" />
          <div>
            <div className="text-gray-600">Out of Pocket</div>
            <div className="font-medium text-gray-900">
              ${Math.round(outOfPocket)}
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Details */}
      {coverage.conditions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Coverage Notes:</div>
          <div className="text-xs text-gray-700">
            {coverage.explanation}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        {onCall && (
          <button
            onClick={() => onCall(facility.phone)}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
          >
            <Phone className="w-3 h-3" />
            Call
          </button>
        )}
        
        {onGetDirections && (
          <button
            onClick={() => onGetDirections(facility.address)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
          >
            <MapPin className="w-3 h-3" />
            Directions
          </button>
        )}
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3 h-3 mr-1" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3 mr-1" />
            Show Details
          </>
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {/* Operating Hours */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Operating Hours</div>
            <div className="text-xs text-gray-600">
              <div>Weekdays: {facility.operatingHours.weekdays}</div>
              <div>Weekends: {facility.operatingHours.weekends}</div>
              {facility.hasAandE && (
                <div>Emergency: {facility.operatingHours.emergency}</div>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Services</div>
            <div className="flex flex-wrap gap-1">
              {facility.services.map((service, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Insurance Panels */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Insurance Panels</div>
            <div className="flex flex-wrap gap-1">
              {facility.insurancePanels.map((panel, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {panel}
                </span>
              ))}
            </div>
          </div>

          {/* Coverage Breakdown */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-1">Coverage Breakdown</div>
            <div className="text-xs text-gray-600 space-y-1">
              {coverage.deductible > 0 && (
                <div>Deductible: ${coverage.deductible}</div>
              )}
              {coverage.coPay > 0 && (
                <div>Co-pay: ${coverage.coPay}</div>
              )}
              {coverage.annualLimit > 0 && (
                <div>Annual Limit: ${coverage.annualLimit}</div>
              )}
              {coverage.remainingLimit > 0 && (
                <div>Remaining: ${coverage.remainingLimit}</div>
              )}
              {coverage.waitingPeriod > 0 && (
                <div>Waiting Period: {coverage.waitingPeriod} days</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthcareOptionCard;

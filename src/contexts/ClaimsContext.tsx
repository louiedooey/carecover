import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClaimHistory } from '../types';

interface ClaimsContextType {
  claims: ClaimHistory[];
  addClaim: (claim: Omit<ClaimHistory, 'id'>) => void;
  updateClaim: (id: string, updates: Partial<ClaimHistory>) => void;
  deleteClaim: (id: string) => void;
  getRecentClaims: (days?: number) => ClaimHistory[];
  getClaimsByType: (type: ClaimHistory['type']) => ClaimHistory[];
  getTotalClaimAmount: (year?: number) => number;
  isLoading: boolean;
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

const STORAGE_KEY = 'carecover_claims_history';

interface ClaimsProviderProps {
  children: ReactNode;
}

export function ClaimsProvider({ children }: ClaimsProviderProps) {
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load claims from localStorage on mount
  useEffect(() => {
    try {
      const storedClaims = localStorage.getItem(STORAGE_KEY);
      if (storedClaims) {
        const parsedClaims = JSON.parse(storedClaims).map((claim: any) => ({
          ...claim,
          date: new Date(claim.date)
        }));
        setClaims(parsedClaims);
      }
    } catch (error) {
      console.error('Error loading claims from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save claims to localStorage whenever claims change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
      } catch (error) {
        console.error('Error saving claims to localStorage:', error);
      }
    }
  }, [claims, isLoading]);

  const addClaim = (claimData: Omit<ClaimHistory, 'id'>) => {
    const newClaim: ClaimHistory = {
      ...claimData,
      id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    setClaims(prevClaims => [newClaim, ...prevClaims]);
  };

  const updateClaim = (id: string, updates: Partial<ClaimHistory>) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === id ? { ...claim, ...updates } : claim
      )
    );
  };

  const deleteClaim = (id: string) => {
    setClaims(prevClaims => prevClaims.filter(claim => claim.id !== id));
  };

  const getRecentClaims = (days: number = 30): ClaimHistory[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return claims.filter(claim => new Date(claim.date) > cutoffDate);
  };

  const getClaimsByType = (type: ClaimHistory['type']): ClaimHistory[] => {
    return claims.filter(claim => claim.type === type);
  };

  const getTotalClaimAmount = (year?: number): number => {
    const targetYear = year || new Date().getFullYear();
    
    return claims
      .filter(claim => new Date(claim.date).getFullYear() === targetYear)
      .reduce((total, claim) => total + claim.amount, 0);
  };

  const value: ClaimsContextType = {
    claims,
    addClaim,
    updateClaim,
    deleteClaim,
    getRecentClaims,
    getClaimsByType,
    getTotalClaimAmount,
    isLoading
  };

  return (
    <ClaimsContext.Provider value={value}>
      {children}
    </ClaimsContext.Provider>
  );
}

export function useClaims(): ClaimsContextType {
  const context = useContext(ClaimsContext);
  if (context === undefined) {
    throw new Error('useClaims must be used within a ClaimsProvider');
  }
  return context;
}

// Helper functions for claim management
export function createClaimFromTreatment(
  facilityName: string,
  amount: number,
  type: ClaimHistory['type'],
  description: string
): Omit<ClaimHistory, 'id'> {
  return {
    date: new Date(),
    amount,
    provider: facilityName,
    type,
    status: 'submitted',
    description
  };
}

export function getClaimStatusColor(status: ClaimHistory['status']): string {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-100';
    case 'rejected':
      return 'text-red-600 bg-red-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'submitted':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getClaimTypeIcon(type: ClaimHistory['type']): string {
  switch (type) {
    case 'emergency':
      return '🚨';
    case 'outpatient':
      return '🏥';
    case 'inpatient':
      return '🏨';
    case 'specialist':
      return '👨‍⚕️';
    default:
      return '📋';
  }
}

export function formatClaimAmount(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getClaimSummary(claims: ClaimHistory[]): {
  total: number;
  byType: Record<ClaimHistory['type'], number>;
  byStatus: Record<ClaimHistory['status'], number>;
  recentCount: number;
} {
  const summary = {
    total: 0,
    byType: {} as Record<ClaimHistory['type'], number>,
    byStatus: {} as Record<ClaimHistory['status'], number>,
    recentCount: 0
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  claims.forEach(claim => {
    // Total amount
    summary.total += claim.amount;

    // By type
    summary.byType[claim.type] = (summary.byType[claim.type] || 0) + claim.amount;

    // By status
    summary.byStatus[claim.status] = (summary.byStatus[claim.status] || 0) + 1;

    // Recent count
    if (new Date(claim.date) > thirtyDaysAgo) {
      summary.recentCount++;
    }
  });

  return summary;
}

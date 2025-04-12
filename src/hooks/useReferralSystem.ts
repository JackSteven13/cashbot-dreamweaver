
import { useState, useEffect, useCallback } from 'react';
import { fetchUserReferrals, generateReferralLink } from '@/utils/referralUtils';

export interface UseReferralSystemReturn {
  referralLink: string;
  referrals: any[]; // Type plus spécifique à définir selon vos données
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useReferralSystem = (userId?: string): UseReferralSystemReturn => {
  const [referralLink, setReferralLink] = useState<string>('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Générer le lien de parrainage
  useEffect(() => {
    if (userId) {
      const link = generateReferralLink(userId);
      setReferralLink(link);
    }
  }, [userId]);
  
  // Charger les parrainages
  const fetchReferrals = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await fetchUserReferrals(userId);
      setReferrals(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des parrainages:", error);
      setReferrals([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  // Charger les données au montage
  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);
  
  return {
    referralLink,
    referrals,
    isLoading,
    refetch: fetchReferrals
  };
};

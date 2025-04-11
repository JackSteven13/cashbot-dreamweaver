
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateReferralLink } from '@/utils/referralUtils';

interface UseReferralSystemReturn {
  referralLink: string;
  referralCount: number;
  totalCommission: number;
  isLoading: boolean;
  error: string | null;
  refreshReferrals: () => Promise<void>;
}

interface Referral {
  id: string;
  referrer_id: string;
  status: string;
  commission_rate: number;
  // Add fields that might be missing or have different names
  active?: boolean;
  commission_earned?: number;
}

export const useReferralSystem = (userId?: string): UseReferralSystemReturn => {
  const [referralLink, setReferralLink] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [totalCommission, setTotalCommission] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferralData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate referral link for the user
      const link = generateReferralLink(userId);
      setReferralLink(link);
      
      // Fetch referral data from the database
      const { data: referrals, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);
      
      if (fetchError) throw fetchError;
      
      // Calculate statistics
      // Check if status is 'active' instead of using the 'active' property directly
      const activeReferrals = (referrals as Referral[] || []).filter(ref => ref.status === 'active');
      setReferralCount(activeReferrals.length);
      
      // Use commission_rate if commission_earned is not available
      const commission = activeReferrals.reduce((sum, ref) => 
        sum + (ref.commission_earned || ref.commission_rate || 0), 0);
      setTotalCommission(commission);
      
    } catch (err) {
      console.error('Error fetching referral data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    if (userId) {
      fetchReferralData();
    } else {
      // If no userId, generate an example link for UI purposes
      setReferralLink(`${window.location.origin}/register?ref=example`);
    }
  }, [userId]);

  // Listen for referral update events
  useEffect(() => {
    const handleReferralUpdate = () => {
      fetchReferralData();
    };
    
    window.addEventListener('referral:update', handleReferralUpdate);
    return () => {
      window.removeEventListener('referral:update', handleReferralUpdate);
    };
  }, [userId]);

  return {
    referralLink,
    referralCount,
    totalCommission,
    isLoading,
    error,
    refreshReferrals: fetchReferralData
  };
};

export default useReferralSystem;

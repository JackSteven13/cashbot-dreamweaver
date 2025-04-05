
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Calculate commission rate based on plan types
 */
export const calculateCommissionRate = (
  referredPlanType: string,
  referrerPlan: string
) => {
  // Base commission rate
  let baseRate = 0.7; // 0.7€ standard
  
  // Adjust based on referred plan
  if (referredPlanType === 'gold') {
    baseRate = 1.5;
  } else if (referredPlanType === 'elite') {
    baseRate = 2.0;
  }
  
  // Bonus for referrer's plan
  let referrerBonus = 1.0; // Default multiplier
  if (referrerPlan === 'starter') {
    referrerBonus = 1.1; // 10% bonus
  } else if (referrerPlan === 'gold') {
    referrerBonus = 1.2; // 20% bonus
  } else if (referrerPlan === 'elite') {
    referrerBonus = 1.3; // 30% bonus
  }
  
  return baseRate * referrerBonus;
};

/**
 * Get commission rate based on subscription type
 * This function is exported for external use
 */
export const getCommissionRate = (subscription: string): number => {
  const rates: Record<string, number> = {
    'freemium': 0.2, // 20%
    'starter': 0.3,  // 30%
    'gold': 0.4,     // 40%
    'elite': 0.5     // 50%
  };
  
  return rates[subscription] || rates['freemium'];
};

/**
 * Get referrer's ID from referral code
 */
export const getReferrerId = async (referralCode: string): Promise<string | null> => {
  if (!referralCode) return null;
  
  try {
    // Extract referrer ID from code (assuming format: {userId}_randomString)
    const referrerId = referralCode.split('_')[0];
    
    if (!referrerId) return null;
    
    // Verify the referrer exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', referrerId)
      .single();
      
    if (error || !data) {
      console.error("Invalid referrer ID:", error);
      return null;
    }
    
    return referrerId;
  } catch (error) {
    console.error("Error getting referrer ID:", error);
    return null;
  }
};

/**
 * Calculate bonus from referrals
 */
export const calculateReferralBonus = (referrals: Array<{ active?: boolean; commission_rate?: number }>) => {
  if (!referrals || referrals.length === 0) return 0;
  
  // Calculate total bonus from active referrals
  return referrals
    .filter(ref => ref.active !== false) // Consider undefined as active too
    .reduce((total, ref) => total + (ref.commission_rate || 0.7), 0);
};

/**
 * Get user's commission information
 */
export const getUserCommissionInfo = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);
      
    if (error) throw error;
    
    return {
      totalReferrals: data?.length || 0,
      activeReferrals: data?.filter(r => r.status === 'active').length || 0,
      totalCommission: data?.reduce((sum, r) => sum + (r.commission_rate || 0), 0) || 0
    };
  } catch (error) {
    console.error("Error fetching commission info:", error);
    return {
      totalReferrals: 0,
      activeReferrals: 0,
      totalCommission: 0
    };
  }
};

/**
 * Apply referral bonus to referrer's balance
 */
export const applyReferralBonus = async (
  referrerId: string, 
  newUserId: string,
  planType: string
): Promise<boolean> => {
  try {
    // Get referrer's subscription
    const { data: referrerData, error: referrerError } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', referrerId)
      .single();
      
    if (referrerError || !referrerData) {
      console.error("Error getting referrer data:", referrerError);
      return false;
    }
    
    // Calculate commission
    const amount = calculateCommissionRate(planType, referrerData.subscription);
    
    // Create referral record
    const { error: referralError } = await supabase
      .from('referrals')
      .insert([
        {
          referrer_id: referrerId,
          referred_user_id: newUserId,
          commission_rate: amount,
          plan_type: planType
        }
      ]);
      
    if (referralError) {
      console.error("Error creating referral record:", referralError);
      return false;
    }
    
    // Add transaction for the commission
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: referrerId,
          gain: Number(amount), // Convert to number
          report: `Commission de parrainage pour l'utilisateur avec plan ${planType}`
        }
      ]);
      
    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return false;
    }
    
    // Update referrer's balance (using a more reliable approach)
    // Instead of using RPC, use a direct update query
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ 
        balance: supabase.rpc('get_current_balance', { user_id: referrerId }) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', referrerId);
      
    if (updateError) {
      console.error("Error updating balance:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error processing referral bonus:", error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors du traitement du parrainage.",
      variant: "destructive"
    });
    return false;
  }
};


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
    
    // Update referrer's balance
    const { error: updateError } = await supabase
      .rpc('update_balance', { 
        user_id: referrerId, 
        amount_change: amount 
      });
      
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

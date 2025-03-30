
import { supabase } from '../helpers/supabaseClient.ts';
import { trackReferral } from './referralService.ts';

// Normalize legacy "alpha" plan to "starter"
const normalizeSubscriptionType = (planType: string): string => {
  if (planType === 'alpha') {
    console.log('Converting legacy plan "alpha" to "starter"');
    return 'starter';
  }
  return planType;
}

// Update user subscription to freemium
export async function updateFreeSubscription(userId: string, plan: string, referrerId: string | null) {
  // Normalize the plan type
  const normalizedPlan = normalizeSubscriptionType(plan);
  
  const { error: updateError } = await supabase
    .from('user_balances')
    .update({ 
      subscription: normalizedPlan,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Database update error:', updateError);
    throw new Error('Failed to update subscription');
  }
  
  // Track referral if applicable
  if (referrerId) {
    await trackReferral(referrerId, userId, normalizedPlan);
  }
  
  return { success: true, free: true };
}

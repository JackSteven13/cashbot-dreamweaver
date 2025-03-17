
import { supabase } from '../helpers/supabaseClient.ts';
import { trackReferral } from './referralService.ts';

// Update user subscription to freemium
export async function updateFreeSubscription(userId: string, plan: string, referrerId: string | null) {
  const { error: updateError } = await supabase
    .from('user_balances')
    .update({ 
      subscription: plan,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Database update error:', updateError);
    throw new Error('Failed to update subscription');
  }
  
  // Track referral if applicable
  if (referrerId) {
    await trackReferral(referrerId, userId, plan);
  }
  
  return { success: true, free: true };
}

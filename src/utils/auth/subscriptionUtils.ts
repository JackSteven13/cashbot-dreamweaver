
import { SUBSCRIPTION_LIMITS } from "@/utils/subscription/constants";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a user is authenticated
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

/**
 * Checks if a user is at their daily limit based on subscription and balance
 */
export const checkDailyLimit = (balance: number, subscription: string) => {
  return balance >= (SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
};

/**
 * Get the effective subscription type (accounting for trials, etc.)
 */
export const getEffectiveSubscription = (subscription: string) => {
  // For now, we just return the subscription as is
  // In the future, this could check for trial status or other modifiers
  return subscription;
};

/**
 * These functions are provided for backward compatibility
 */
export const subscribeToAuthChanges = () => {
  console.log("Auth change subscription function called - deprecated");
  return () => {}; // Return noop cleanup function
};

export const unsubscribeFromAuthChanges = () => {
  console.log("Auth change unsubscription function called - deprecated");
};

export { shouldResetDailyCounters } from '@/utils/subscription/sessionManagement';


import { SUBSCRIPTION_LIMITS } from "@/utils/subscription/constants";

/**
 * Checks if a user is at their daily limit based on subscription and balance
 */
export const checkDailyLimit = (balance: number, subscription: string) => {
  return balance >= (SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
};

/**
 * These functions are placeholders - we don't actually need them anymore,
 * but they're referenced in the imports so we need to provide them
 */
export const subscribeToAuthChanges = () => {
  console.log("Auth change subscription function called - deprecated");
  return () => {}; // Noop cleanup function
};

export const unsubscribeFromAuthChanges = () => {
  console.log("Auth change unsubscription function called - deprecated");
};

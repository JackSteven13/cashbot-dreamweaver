
import { fetchUserProfile } from './profileUtils';
import { fetchUserBalance } from './balanceUtils';
import { fetchUserTransactions } from './transactionUtils';
import { fetchUserReferrals, generateReferralLink } from "@/utils/referralUtils";

/**
 * Fetch complete user data including referrals
 */
export const fetchCompleteUserData = async (userId: string, userEmail?: string | null) => {
  try {
    // Get profile
    const profile = await fetchUserProfile(userId, userEmail);
    
    // Get balance
    const balanceResult = await fetchUserBalance(userId);
    
    // Get transactions
    const transactions = await fetchUserTransactions(userId);
    
    // Get referrals
    const referrals = await fetchUserReferrals(userId);
    
    // Generate referral link
    const referralLink = generateReferralLink(userId);
    
    return {
      profile,
      balance: balanceResult?.data,
      transactions,
      referrals,
      referralLink,
      isNewUser: balanceResult?.isNewUser || false
    };
  } catch (error) {
    console.error("Error fetching complete user data:", error);
    return null;
  }
};

// Re-export individual functions for backward compatibility
export { fetchUserProfile } from './profileUtils';
export { fetchUserBalance } from './balanceUtils';
export { fetchUserTransactions } from './transactionUtils';

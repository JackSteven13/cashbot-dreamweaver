
import { verifyAuth, refreshSession } from "@/utils/auth";

/**
 * Hook that handles authentication verification and refresh
 */
export const useAuthRefresh = () => {
  // Verify authentication status
  const verifyAuthentication = async (): Promise<boolean> => {
    return await verifyAuth();
  };
  
  // Attempt to refresh the session
  const attemptSessionRefresh = async (): Promise<boolean> => {
    console.log("Auth not valid, attempting refresh...");
    return await refreshSession();
  };

  return {
    verifyAuthentication,
    attemptSessionRefresh
  };
};

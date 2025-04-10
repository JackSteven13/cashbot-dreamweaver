
import { useAuthSession } from "./session/useAuthSession";
import { useSessionCount } from "./session/useSessionCount";
import { useBalanceOperations } from "./session/useBalanceOperations";
import { useUserDataRefresh } from "./session/useUserDataRefresh";

export const useUserSession = () => {
  const { session } = useAuthSession();
  const { incrementSessionCount } = useSessionCount();
  const { updateBalance, resetBalance } = useBalanceOperations();
  const { refreshUserData } = useUserDataRefresh();

  return {
    session,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    refreshUserData
  };
};

// Re-export the BalanceUpdateResult interface for consumers
export type { BalanceUpdateResult } from "./session/useBalanceOperations";

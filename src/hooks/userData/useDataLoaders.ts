
import { useProfileLoader } from '../useProfileLoader';
import { useBalanceLoader } from '../useBalanceLoader';

export const useDataLoaders = (setIsNewUser: (isNew: boolean) => void) => {
  const { loadUserProfile, isNewUser } = useProfileLoader();
  const { loadUserBalance } = useBalanceLoader(setIsNewUser);

  return {
    loadUserProfile,
    loadUserBalance,
    isNewUser
  };
};


import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

export const useSessionValidation = (userData: UserData | Partial<UserData>, dailySessionCount: number) => {
  const checkSessionLimit = () => {
    const subscription = userData?.subscription || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    return {
      canStartSession: dailySessionCount < 100,
      sessionErrors: [],
      isLimitReached: false,
      currentLimit: dailyLimit
    };
  };

  return checkSessionLimit();
};


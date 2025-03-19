
import { UserData } from '@/types/userData';

export interface UseManualSessionsProps {
  userData: UserData;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
}

export interface UseManualSessionsReturn {
  isStartingSession: boolean;
  handleStartSession: () => Promise<void>;
  localBalance?: number; // Add the localBalance property as optional
}

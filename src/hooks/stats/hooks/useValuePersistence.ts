
import { useEffect } from 'react';
import { saveValues } from '../utils/storageManager';

interface UseValuePersistenceParams {
  adsCount: number;
  revenueCount: number;
}

/**
 * Hook to ensure values are persisted before page unload
 */
export const useValuePersistence = ({
  adsCount,
  revenueCount
}: UseValuePersistenceParams) => {
  useEffect(() => {
    // Save current values before closing or refreshing
    const handleBeforeUnload = () => {
      saveValues(adsCount, revenueCount, false);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [adsCount, revenueCount]);
};

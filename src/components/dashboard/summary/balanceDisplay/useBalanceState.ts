
import { useEffect, useState } from 'react';
import { useBalanceEvents, BalanceState } from './useBalanceEvents';
import { calculateLimitWarningLevel } from '@/utils/balance/limitCalculations';

export interface BalanceDisplayData extends BalanceState {
  warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  warningMessage: string;
  shouldDisableBot: boolean;
  shouldDisableSessions: boolean;
}

export const useBalanceState = (balance: number, subscription: string): BalanceDisplayData => {
  const balanceState = useBalanceEvents(subscription);
  const [warningData, setWarningData] = useState<{
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    message: string;
    disableBot: boolean;
    disableSessions: boolean;
  }>({
    level: 'none',
    message: '',
    disableBot: false,
    disableSessions: false
  });

  useEffect(() => {
    // Calculer le niveau d'avertissement basé sur le pourcentage
    const warningInfo = calculateLimitWarningLevel(
      balanceState.limitPercentage,
      balanceState.dailyLimit,
      balanceState.dailyGains
    );
    
    setWarningData({
      level: warningInfo.level,
      message: warningInfo.message,
      disableBot: balanceState.limitPercentage >= 90,
      disableSessions: balanceState.limitPercentage >= 97
    });
    
    // Si le niveau d'alerte est élevé ou critique, désactiver les fonctionnalités automatiquement
    if (warningInfo.level === 'high' || warningInfo.level === 'critical') {
      window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
        detail: { active: false, reason: 'limit_approaching' } 
      }));
      
      localStorage.setItem('botActive', 'false');
    }
  }, [balanceState]);

  return {
    ...balanceState,
    warningLevel: warningData.level,
    warningMessage: warningData.message,
    shouldDisableBot: warningData.disableBot,
    shouldDisableSessions: warningData.disableSessions
  };
};


/**
 * Helper functions to dispatch session-related events
 */
export const dispatchSessionStart = (): void => {
  window.dispatchEvent(new CustomEvent('session:start'));
};

export const dispatchBalanceUpdate = (finalGain: number, userId?: string): void => {
  window.dispatchEvent(new CustomEvent('balance:update', { 
    detail: { 
      amount: finalGain,
      animate: true,
      userId
    } 
  }));
};

export const dispatchForceBalanceUpdate = (newBalance: number, finalGain: number, userId?: string): void => {
  window.dispatchEvent(new CustomEvent('balance:force-update', { 
    detail: { 
      newBalance,
      gain: finalGain,
      animate: true,
      userId
    } 
  }));
};

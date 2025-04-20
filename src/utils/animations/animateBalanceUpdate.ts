
/**
 * Utilitaires pour animer les mises à jour du solde
 */

/**
 * Déclenche une animation de mise à jour du solde
 */
export const animateBalanceUpdate = (
  amount: number, 
  newBalance: number,
  options: {
    animate?: boolean;
    userId?: string;
    transactionDate?: string;
  } = {}
): void => {
  const { animate = true, userId, transactionDate = new Date().toISOString() } = options;
  
  // Déclencher l'événement de mise à jour du solde
  window.dispatchEvent(new CustomEvent('balance:update', {
    detail: {
      amount,
      newBalance,
      animate,
      userId,
      transactionDate
    }
  }));
  
  // Si l'animation est activée, ajouter des effets visuels
  if (animate) {
    // Déclencher une animation de particules si elle existe
    window.dispatchEvent(new CustomEvent('balance:animate', {
      detail: {
        amount,
        type: amount > 0 ? 'gain' : 'loss'
      }
    }));
    
    // Déclencher une mise à jour du terminal si disponible
    window.dispatchEvent(new CustomEvent('terminal:update', {
      detail: {
        message: `${amount > 0 ? 'Gain' : 'Perte'} de ${Math.abs(amount).toFixed(2)}€`,
        type: amount > 0 ? 'success' : 'warning'
      }
    }));
  }
};

/**
 * Convertit les événements de gain en animations
 */
export const setupBalanceAnimations = (): () => void => {
  // Conversion des événements dashboard:micro-gain en animations de solde
  const handleMicroGain = (event: CustomEvent) => {
    const { amount } = event.detail || {};
    if (typeof amount === 'number' && amount > 0) {
      animateBalanceUpdate(amount, 0, { animate: true });
    }
  };
  
  // Conversion des événements analysis-complete en animations de solde
  const handleAnalysisComplete = (event: CustomEvent) => {
    const { gain } = event.detail || {};
    if (typeof gain === 'number' && gain > 0) {
      animateBalanceUpdate(gain, 0, { animate: true });
    }
  };

  window.addEventListener('dashboard:micro-gain', handleMicroGain as EventListener);
  window.addEventListener('analysis-complete', handleAnalysisComplete as EventListener);
  
  // Fonction de nettoyage
  return () => {
    window.removeEventListener('dashboard:micro-gain', handleMicroGain as EventListener);
    window.removeEventListener('analysis-complete', handleAnalysisComplete as EventListener);
  };
};

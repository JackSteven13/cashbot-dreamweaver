
import { animateBalanceUpdate } from '@/utils/animations/animateBalanceUpdate';
import { createMoneyParticles } from '@/utils/animations';

/**
 * Helper functions for balance animations during session updates
 */
export const startBalanceAnimation = () => {
  // Trigger visual feedback for balance animation
  document.querySelectorAll('.balance-display').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.classList.add('glow-effect');
      createMoneyParticles(el, 5); // Create money particles for visual feedback
    }
  });
};

export const stopBalanceAnimation = () => {
  // Remove visual effects after animation
  document.querySelectorAll('.balance-display').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.classList.remove('glow-effect');
    }
  });
};

/**
 * Animate balance update with a smooth transition
 */
export const animateBalance = (
  startBalance: number,
  newBalance: number,
  setLocalBalance: (value: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    animateBalanceUpdate(
      startBalance,
      newBalance,
      1500, // longer animation duration for better visibility
      (value) => {
        setLocalBalance(value);
      },
      () => resolve()
    );
  });
};

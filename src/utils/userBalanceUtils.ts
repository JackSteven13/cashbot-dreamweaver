
// Re-export balance utility functions from their respective files
export { handleError } from './balance/errorHandling';
export { updateUserBalance } from './balance/updateBalance';
export { resetUserBalance } from './balance/resetBalance';
export { updateSessionCount } from './balance/sessionCount';

// Re-export dormancy utilities
export { 
  checkAccountDormancy,
  calculateDormancyPenalties,
  applyDormancyPenalties,
  calculateReactivationFee,
  reactivateAccount,
  DORMANCY_CONSTANTS
} from './balance/dormancyUtils';


/**
 * This file bridges the gap between different transaction utility files 
 * to maintain backward compatibility
 */
import { 
  fetchUserTransactions as fetchUserTransactionsFromUser,
  addTransaction as addTransactionFromUser,
  calculateTodaysGains as calculateTodaysGainsFromUser,
  getTodaysTransactions as getTodaysTransactionsFromUser
} from '../user/transactionUtils';

// Re-export functions from user/transactionUtils
export const fetchUserTransactionsFromUserUtils = fetchUserTransactionsFromUser;
export const addTransactionFromUserUtils = addTransactionFromUser;
export const calculateTodaysGainsFromUserUtils = calculateTodaysGainsFromUser;
export const getTodaysTransactionsFromUserUtils = getTodaysTransactionsFromUser;

// Export our own implementations to use throughout the app
export { 
  fetchUserTransactions,
  addTransaction,
  calculateTodaysGains,
  getTodaysTransactions
} from './transactionUtils';

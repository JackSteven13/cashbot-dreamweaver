
// Export auth utilities with explicit exports pour éviter les conflits
export { getCurrentSession, forceSignOut } from './sessionUtils';
export { refreshSession } from './sessionUtils'; // Export explicite pour éviter le conflit
export { verifyAuth } from './verificationUtils';
// Éviter le conflit en n'exportant pas refreshSession de verificationUtils
// à la place on exportera explicitement à partir du sessionUtils

// Export subscription utils correctly
export { checkDailyLimit } from './subscriptionUtils';

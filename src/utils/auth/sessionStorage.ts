
/**
 * Utility functions for managing session storage related to authentication
 */

/**
 * Save a session to localStorage
 * @param session The session object to save
 */
export const saveSession = (session: any): void => {
  try {
    localStorage.setItem('supabase_session', JSON.stringify(session));
    localStorage.setItem('last_session_time', new Date().toISOString());
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
};

/**
 * Get the saved session from localStorage
 * @returns The saved session or null if not found
 */
export const getSavedSession = (): any | null => {
  try {
    const sessionStr = localStorage.getItem('supabase_session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (error) {
    console.error('Failed to parse saved session:', error);
    return null;
  }
};

/**
 * Clear the saved session
 */
export const clearSession = (): void => {
  localStorage.removeItem('supabase_session');
  localStorage.removeItem('last_session_time');
};

/**
 * Check if a session is still valid
 * @param session The session to check
 * @returns True if the session is still valid, false otherwise
 */
export const isSessionValid = (session: any): boolean => {
  if (!session || !session.expires_at) return false;
  
  // Session expiration is in seconds, convert to milliseconds
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  
  return expiresAt > now;
};

/**
 * Get the time until session expiration
 * @param session The session to check
 * @returns The time until expiration in milliseconds, or 0 if expired/invalid
 */
export const getSessionTimeRemaining = (session: any): number => {
  if (!session || !session.expires_at) return 0;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  
  const timeRemaining = expiresAt.getTime() - now.getTime();
  return Math.max(0, timeRemaining);
};

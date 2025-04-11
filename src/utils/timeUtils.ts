
/**
 * Get current time in Paris timezone
 * @returns Date string formatted for Paris timezone
 */
export function getParisTime(): string {
  return new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
}

/**
 * Calculate time until midnight in milliseconds
 */
export function calculateTimeUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format time for display
 */
export function formatTime(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(dateObj)} ${formatTime(dateObj)}`;
}

/**
 * Get the current date in YYYY-MM-DD format
 */
export function getCurrentDateYMD(): string {
  return new Date().toISOString().split('T')[0];
}

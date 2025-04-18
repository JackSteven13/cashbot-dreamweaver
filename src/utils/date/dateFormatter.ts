
/**
 * Utility functions for date formatting and value generation
 */

/**
 * Format a date for storage
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDateForStorage(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

/**
 * Generate a stable value based on the current date
 * This ensures consistent values for the same day
 * @returns A number derived from the current date
 */
export function generateDateBasedValue(): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const yearFactor = now.getFullYear() * 100;
  
  // Generate a base value from the date components
  // This will be consistent throughout the day but change each day
  const baseValue = (yearFactor + dayOfYear) * 1000;
  
  // Add some randomization but keep it within a reasonable range
  const randomFactor = 0.85 + (Math.sin(dayOfYear) * 0.15);
  
  return Math.round(baseValue * randomFactor);
}


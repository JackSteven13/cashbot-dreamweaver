
/**
 * Format revenue with correct spacing for thousands and € symbol
 * @param value Number to format as currency
 * @returns Formatted string with Euro currency symbol
 */
export const formatRevenue = (value: number): string => {
  // Utiliser l'API Intl pour formater correctement avec le séparateur de milliers et le symbole euro
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    currencyDisplay: 'symbol'
  }).format(value);
};

/**
 * Format a timestamp into a readable date and time string in French format
 * @param timestamp Timestamp string to format
 * @returns Formatted date and time string
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Date invalide";
  }
};


/**
 * Retry mechanism for operations prone to failure
 * 
 * @param operation The function to execute
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay between retries in milliseconds
 * @param backoffFactor Factor to increase delay with each retry
 * @returns Result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  backoffFactor = 2
): Promise<T> {
  let lastError: unknown;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt <= maxRetries) {
        console.warn(`Tentative ${attempt} échouée, nouvelle tentative dans ${currentDelay}ms:`, error);
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        // Increase delay for next attempt
        currentDelay *= backoffFactor;
      }
    }
  }

  // If all attempts failed
  throw lastError;
}

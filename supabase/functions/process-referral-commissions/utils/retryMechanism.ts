
// Mécanisme de relance pour les opérations sujettes à échec

/**
 * Exécute une fonction avec un mécanisme de relance en cas d'échec
 * @param operation La fonction à exécuter
 * @param maxRetries Nombre maximum de tentatives
 * @param delayMs Délai entre les tentatives (en ms)
 * @param backoffFactor Facteur d'augmentation du délai entre chaque tentative
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
        
        // Attendre avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        // Augmenter le délai pour la prochaine tentative
        currentDelay *= backoffFactor;
      }
    }
  }

  // Si toutes les tentatives ont échoué
  throw lastError;
}

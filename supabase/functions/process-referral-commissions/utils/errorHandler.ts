
// Gestionnaire d'erreurs centralisé
export function handleError(error: unknown, context: string): { error: string, details?: any, context: string } {
  console.error(`${context}:`, error);
  
  // Normaliser l'erreur en un objet structuré
  const errorResponse = {
    error: error instanceof Error ? error.message : 'Erreur inconnue',
    details: error instanceof Error && (error as any).details ? (error as any).details : undefined,
    context
  };
  
  return errorResponse;
}

// Créer une erreur avec des détails supplémentaires
export function createDetailedError(message: string, details: any): Error {
  const error = new Error(message);
  (error as any).details = details;
  return error;
}

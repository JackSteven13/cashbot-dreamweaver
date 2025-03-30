
/**
 * Centralized error handler
 * @param error The error to handle
 * @param context Context information for where the error occurred
 * @returns Structured error response
 */
export function handleError(error: unknown, context: string): { error: string, details?: any, context: string } {
  console.error(`${context}:`, error);
  
  // Normalize the error into a structured object
  const errorResponse = {
    error: error instanceof Error ? error.message : 'Erreur inconnue',
    details: error instanceof Error && (error as any).details ? (error as any).details : undefined,
    context
  };
  
  return errorResponse;
}

/**
 * Create an error with additional details
 * @param message Error message
 * @param details Additional error details
 * @returns Error object with details
 */
export function createDetailedError(message: string, details: any): Error {
  const error = new Error(message);
  (error as any).details = details;
  return error;
}


/**
 * Interface pour les résultats du traitement des commissions
 */
export interface CommissionProcessingResult {
  success: boolean;
  message: string;
  processed?: number;
  errors?: number;
  failedIds?: string[];
}

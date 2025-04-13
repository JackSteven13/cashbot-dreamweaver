
export type PlanType = 'freemium' | 'starter' | 'gold' | 'elite' | null;

export interface PaymentFormData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  expiry?: string; // Add this for compatibility
  cvc?: string;    // Add this for compatibility
}

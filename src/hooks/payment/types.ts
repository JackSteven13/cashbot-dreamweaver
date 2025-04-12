
export type PlanType = 'freemium' | 'starter' | 'gold' | 'elite' | null;

export interface PaymentFormData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

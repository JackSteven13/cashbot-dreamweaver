
// Constants for the calculator component
export const SUBSCRIPTION_LABELS: Record<string, string> = {
  'freemium': 'Freemium (Gratuit)',
  'starter': 'Starter',
  'gold': 'Gold',
  'elite': 'Elite'
};

export const SUBSCRIPTION_PRICES: Record<string, number> = {
  'freemium': 0,
  'starter': 99,
  'gold': 349,
  'elite': 549
};

// Descriptions qui mettent en avant l'unicité de chaque forfait
export const SUBSCRIPTION_DESCRIPTIONS: Record<string, string> = {
  'freemium': 'Découverte et premiers pas',
  'starter': 'Idéal pour décoller votre projet',
  'gold': 'Accélérez vos performances',
  'elite': 'Solution professionnelle ultime'
};

// New annual billing period
export const BILLING_PERIOD = 'an';

// Order for displaying plans - Elite first, then Gold, Starter, and Freemium
export const DISPLAY_ORDER = ['elite', 'gold', 'starter', 'freemium'];

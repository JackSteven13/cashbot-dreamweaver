
export type PlanType = 'freemium' | 'starter' | 'gold' | 'elite' | null;

interface PlanDetails {
  name: string;
  price: number;
  features: string[];
  dailyLimit: number;
}

export const PLANS: Record<string, PlanDetails> = {
  freemium: {
    name: "Freemium",
    price: 0,
    features: [
      "1 session d'analyse par jour",
      "Limite quotidienne de 0,50€",
      "Accès aux analyses basiques",
      "Support par email"
    ],
    dailyLimit: 0.5
  },
  starter: {
    name: "Starter",
    price: 99,
    features: [
      "12 sessions d'analyse par jour",
      "Limite quotidienne de 5€",
      "Analyses détaillées",
      "Commissions de parrainage améliorées",
      "Support prioritaire"
    ],
    dailyLimit: 5
  },
  gold: {
    name: "Gold",
    price: 349,
    features: [
      "24 sessions d'analyse par jour",
      "Limite quotidienne de 12€",
      "Analyses premium",
      "Commissions de parrainage élevées",
      "Support dédié"
    ],
    dailyLimit: 12
  },
  elite: {
    name: "Elite",
    price: 549,
    features: [
      "Sessions d'analyse illimitées",
      "Limite quotidienne de 25€",
      "Analyses exclusives",
      "Commissions de parrainage maximales",
      "Support VIP"
    ],
    dailyLimit: 25
  }
};

export const getPlanById = (planId: string | null): PlanType => {
  if (!planId) return null;
  
  // Vérifier si l'ID est une clé valide dans notre objet PLANS
  if (PLANS.hasOwnProperty(planId)) {
    return planId as PlanType;
  }
  
  return null;
};

export const getPlanDetails = (planId: string | null): PlanDetails | null => {
  if (!planId) return null;
  return PLANS[planId] || null;
};

export const getPlanPrice = (planId: string | null): number => {
  if (!planId) return 0;
  return PLANS[planId]?.price || 0;
};

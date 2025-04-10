/**
 * Détermine si un retrait est autorisé en fonction de l'abonnement et des parrainages
 * @param subscription Type d'abonnement
 * @param referralCount Nombre de parrainages actifs
 * @returns Booléen indiquant si le retrait est autorisé
 */
export function isWithdrawalAllowed(
  subscription: string = 'freemium', 
  referralCount: number = 0
): boolean {
  // Règles pour le retrait selon le type d'abonnement
  if (subscription === 'freemium') {
    // Les utilisateurs freemium doivent avoir au moins un parrainage actif
    return referralCount > 0;
  }
  
  // Les abonnements payants peuvent toujours retirer
  return subscription === 'starter' || 
         subscription === 'gold' || 
         subscription === 'elite';
}

/**
 * Obtient le seuil minimum de retrait en fonction de l'abonnement
 * @param subscription Type d'abonnement
 * @returns Montant minimum pour un retrait
 */
export function getWithdrawalThreshold(subscription: string = 'freemium'): number {
  const thresholds: Record<string, number> = {
    'freemium': 200,  // 200€ minimum pour freemium
    'starter': 100,   // 100€ minimum pour starter
    'gold': 50,       // 50€ minimum pour gold
    'elite': 25       // 25€ minimum pour elite
  };
  
  return thresholds[subscription] || 200;
}

/**
 * Calcule combien un utilisateur pourrait gagner via le parrainage pour atteindre son seuil
 * @param subscription Type d'abonnement
 * @param currentBalance Solde actuel de l'utilisateur
 * @returns Informations sur le montant manquant et le nombre estimé de parrainages nécessaires
 */
export function calculateReferralToReachThreshold(
  subscription: string = 'freemium',
  currentBalance: number = 0
): { 
  amountNeeded: number, 
  estimatedReferrals: number 
} {
  const threshold = getWithdrawalThreshold(subscription);
  const amountNeeded = Math.max(0, threshold - currentBalance);
  
  // Estimer le gain moyen par parrainage selon le forfait
  const averageReferralGain: Record<string, number> = {
    'freemium': 10,
    'starter': 20,
    'gold': 30,
    'elite': 40
  };
  
  const avgGain = averageReferralGain[subscription] || 10;
  const estimatedReferrals = Math.ceil(amountNeeded / avgGain);
  
  return {
    amountNeeded,
    estimatedReferrals
  };
}

/**
 * Calcule les frais de retrait en fonction de l'ancienneté du compte et de l'abonnement
 * @param registrationDate Date d'inscription de l'utilisateur
 * @param subscription Type d'abonnement
 * @returns Frais de retrait (pourcentage en décimal)
 */
export function calculateWithdrawalFee(
  registrationDate: Date = new Date(), 
  subscription: string = 'freemium'
): number {
  // Base de frais selon l'abonnement
  const baseFees: Record<string, number> = {
    'freemium': 0.15, // 15% pour freemium
    'starter': 0.10,  // 10% pour starter
    'gold': 0.05,     // 5% pour gold
    'elite': 0.03     // 3% pour elite
  };
  
  const baseFee = baseFees[subscription] || 0.15;
  
  // Réduction des frais selon l'ancienneté du compte
  const now = new Date();
  const accountAgeInDays = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Réduction progressive des frais pour les comptes anciens
  if (accountAgeInDays > 365) {
    // -50% après 1 an
    return baseFee * 0.5;
  } else if (accountAgeInDays > 180) {
    // -30% après 6 mois
    return baseFee * 0.7;
  } else if (accountAgeInDays > 90) {
    // -15% après 3 mois
    return baseFee * 0.85;
  }
  
  return baseFee;
}

/**
 * Vérifie si un utilisateur a atteint la limite de fréquence de retrait
 * @param lastWithdrawalDate Date du dernier retrait
 * @param subscription Type d'abonnement
 * @returns Objet contenant le statut et le temps d'attente restant
 */
export function checkWithdrawalFrequencyLimit(
  lastWithdrawalDate: Date | null = null, 
  subscription: string = 'freemium'
): { allowed: boolean, daysRemaining: number } {
  if (!lastWithdrawalDate) return { allowed: true, daysRemaining: 0 };
  
  // Fréquence de retrait selon l'abonnement (en jours)
  const withdrawalFrequency: Record<string, number> = {
    'freemium': 30,  // 1 fois par mois pour freemium
    'starter': 14,   // 1 fois toutes les 2 semaines pour starter
    'gold': 7,       // 1 fois par semaine pour gold
    'elite': 3       // 1 fois tous les 3 jours pour elite
  };
  
  const frequency = withdrawalFrequency[subscription] || 30;
  const now = new Date();
  const diffTime = now.getTime() - lastWithdrawalDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < frequency) {
    return {
      allowed: false,
      daysRemaining: frequency - diffDays
    };
  }
  
  return { allowed: true, daysRemaining: 0 };
}

/**
 * Récupère le processus de retrait (temps de traitement, etc.) selon l'abonnement
 */
export function getWithdrawalProcess(subscription: string = 'freemium'): {
  processingDays: string,
  methods: string[]
} {
  const processes: Record<string, { processingDays: string, methods: string[] }> = {
    'freemium': { 
      processingDays: '14-21 jours',
      methods: ['Virement bancaire']
    },
    'starter': { 
      processingDays: '7-14 jours',
      methods: ['Virement bancaire', 'PayPal']
    },
    'gold': { 
      processingDays: '3-7 jours',
      methods: ['Virement bancaire', 'PayPal', 'Crypto']
    },
    'elite': { 
      processingDays: '1-3 jours',
      methods: ['Virement bancaire', 'PayPal', 'Crypto', 'Carte prépayée']
    }
  };
  
  return processes[subscription] || processes.freemium;
}

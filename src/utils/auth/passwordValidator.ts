
/**
 * Version ultra simplifiée des utilitaires de validation de mot de passe
 * Toutes les vérifications avancées ont été supprimées
 */

// Score de sécurité du mot de passe (0-100)
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  // Calcul simplifié basé uniquement sur la longueur
  let score = 0;
  
  // Longueur
  if (password.length >= 8) score += 60;
  if (password.length >= 10) score += 20;
  if (password.length >= 12) score += 20;
  
  return Math.min(100, score);
};

// Retourne les problèmes détectés dans le mot de passe
export const getPasswordIssues = (password: string): string[] => {
  const issues: string[] = [];
  
  if (password.length < 8) {
    issues.push("Le mot de passe doit contenir au moins 8 caractères");
  }
  
  return issues;
};

// Fonction principale pour vérifier si un mot de passe est suffisamment sécurisé
export const isPasswordSecure = (password: string): boolean => {
  return password.length >= 8;
};

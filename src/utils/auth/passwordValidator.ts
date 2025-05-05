
/**
 * Utilitaire de validation de la force des mots de passe
 * Version simplifiée sans vérification externe de mots de passe divulgués
 */

// Vérification des caractères spéciaux
const hasSpecialChar = (password: string): boolean => {
  const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  return specialChars.test(password);
};

// Vérification des chiffres
const hasNumber = (password: string): boolean => {
  return /\d/.test(password);
};

// Vérification des lettres majuscules
const hasUpperCase = (password: string): boolean => {
  return /[A-Z]/.test(password);
};

// Vérification des lettres minuscules
const hasLowerCase = (password: string): boolean => {
  return /[a-z]/.test(password);
};

// Score de sécurité du mot de passe (0-100)
export const getPasswordStrength = (password: string, email?: string): number => {
  if (!password) return 0;
  
  let score = 0;
  
  // Longueur minimale
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Complexité
  if (hasSpecialChar(password)) score += 15;
  if (hasNumber(password)) score += 15;
  if (hasUpperCase(password)) score += 15;
  if (hasLowerCase(password)) score += 15;
  
  return Math.max(0, Math.min(100, score));
};

// Retourne les problèmes détectés dans le mot de passe
export const getPasswordIssues = (password: string, email?: string): string[] => {
  const issues: string[] = [];
  
  if (password.length < 8) {
    issues.push("Le mot de passe doit contenir au moins 8 caractères");
  }
  
  if (!hasUpperCase(password)) {
    issues.push("Le mot de passe doit contenir au moins une majuscule");
  }
  
  if (!hasLowerCase(password)) {
    issues.push("Le mot de passe doit contenir au moins une minuscule");
  }
  
  if (!hasNumber(password)) {
    issues.push("Le mot de passe doit contenir au moins un chiffre");
  }
  
  if (!hasSpecialChar(password)) {
    issues.push("Le mot de passe doit contenir au moins un caractère spécial");
  }
  
  return issues;
};

// Fonction principale pour vérifier si un mot de passe est suffisamment sécurisé
export const isPasswordSecure = (password: string, email?: string): boolean => {
  return getPasswordStrength(password, email) >= 60;
};


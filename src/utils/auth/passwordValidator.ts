
/**
 * Utilitaire de validation de la force des mots de passe
 * Cette implémentation côté client remplace la fonction premium de Supabase
 * qui utilise l'API HaveIBeenPwned
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

// Liste de mots de passe communs à éviter
const commonPasswords = [
  'password', 'azerty', '123456', 'qwerty', '12345678', 'password1', 'admin', 
  'welcome', '123456789', 'abc123', '111111', '123123', 'admin123', 'letmein',
  'motdepasse', 'soleil', 'bonjour', 'marseille', 'paris', 'france', 'jetaime',
  'azerty123', 'password123'
];

// Vérification que le mot de passe n'est pas dans la liste des mots de passe courants
const isCommonPassword = (password: string): boolean => {
  return commonPasswords.includes(password.toLowerCase());
};

// Vérification que le mot de passe n'est pas similaire à l'email
const isSimilarToEmail = (password: string, email: string): boolean => {
  // Si l'email est null ou undefined, on considère que ce n'est pas similaire
  if (!email) return false;
  
  // Si le mot de passe contient la partie avant @ de l'email
  const emailUsername = email.split('@')[0].toLowerCase();
  if (emailUsername && emailUsername.length > 3 && password.toLowerCase().includes(emailUsername)) {
    return true;
  }
  
  // Si le mot de passe contient le domaine de l'email
  const emailDomain = email.split('@')[1]?.split('.')[0].toLowerCase();
  if (emailDomain && emailDomain.length > 3 && password.toLowerCase().includes(emailDomain)) {
    return true;
  }
  
  return false;
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
  
  // Pénalités
  if (isCommonPassword(password)) score = Math.min(score, 20);
  if (isSimilarToEmail(password, email)) score = Math.min(score, 30);
  
  // Si le mot de passe est trop court, le score maximum est réduit
  if (password.length < 8) score = Math.min(score, 30);
  if (password.length < 6) score = Math.min(score, 10);
  
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
  
  if (isCommonPassword(password)) {
    issues.push("Ce mot de passe est trop courant et facilement devinable");
  }
  
  if (isSimilarToEmail(password, email)) {
    issues.push("Le mot de passe ne doit pas contenir votre adresse email");
  }
  
  return issues;
};

// Fonction principale pour vérifier si un mot de passe est suffisamment sécurisé
export const isPasswordSecure = (password: string, email?: string): boolean => {
  return getPasswordStrength(password, email) >= 60;
};

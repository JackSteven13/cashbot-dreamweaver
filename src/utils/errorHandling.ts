
import { toast } from "@/components/ui/use-toast";

/**
 * Types d'erreurs gérées par l'application
 */
export enum ErrorType {
  AUTHENTICATION = 'auth',
  DATABASE = 'database',
  NETWORK = 'network',
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  WITHDRAWAL = 'withdrawal',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

/**
 * Interface pour les erreurs formatées
 */
export interface FormattedError {
  type: ErrorType;
  message: string;
  detail?: string;
  code?: string;
  timestamp: number;
  userId?: string;
}

// Débouncer pour éviter trop de toasts d'erreur
const errorDebouncer = {
  lastErrorTime: 0,
  lastErrorMessage: '',
  debounceTime: 3000
};

/**
 * Centralise la gestion des erreurs avec logging et affichage de toast
 */
export function handleError(
  error: any, 
  context: string, 
  type: ErrorType = ErrorType.UNKNOWN, 
  showToast: boolean = true
): FormattedError {
  // Formatage de l'erreur
  const formattedError: FormattedError = {
    type,
    message: error?.message || 'Une erreur est survenue',
    detail: context,
    code: error?.code || 'ERR_UNKNOWN',
    timestamp: Date.now()
  };
  
  // Logging de l'erreur
  console.error(`[${formattedError.type.toUpperCase()}] ${context}:`, error);
  
  // Affichage d'un toast (avec debouncing)
  if (showToast) {
    const now = Date.now();
    const isSameError = formattedError.message === errorDebouncer.lastErrorMessage;
    const isWithinDebounceTime = now - errorDebouncer.lastErrorTime < errorDebouncer.debounceTime;
    
    if (!isSameError || !isWithinDebounceTime) {
      errorDebouncer.lastErrorTime = now;
      errorDebouncer.lastErrorMessage = formattedError.message;
      
      toast({
        title: getErrorTitle(formattedError.type),
        description: getErrorMessage(formattedError),
        variant: "destructive"
      });
    }
  }
  
  return formattedError;
}

/**
 * Obtient un titre approprié pour le toast d'erreur
 */
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.AUTHENTICATION:
      return "Erreur d'authentification";
    case ErrorType.DATABASE:
      return "Erreur de base de données";
    case ErrorType.NETWORK:
      return "Erreur de connexion";
    case ErrorType.PAYMENT:
      return "Erreur de paiement";
    case ErrorType.SUBSCRIPTION:
      return "Erreur d'abonnement";
    case ErrorType.WITHDRAWAL:
      return "Erreur de retrait";
    case ErrorType.SECURITY:
      return "Erreur de sécurité";
    default:
      return "Erreur";
  }
}

/**
 * Personnalise le message d'erreur pour l'utilisateur
 */
function getErrorMessage(error: FormattedError): string {
  // Messages d'erreur personnalisés selon le type et le code
  if (error.type === ErrorType.AUTHENTICATION) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return "Identifiants invalides. Veuillez vérifier votre email et mot de passe.";
    }
  }
  
  if (error.type === ErrorType.DATABASE && error.code?.includes('PGRST')) {
    return "Problème d'accès aux données. Veuillez réessayer.";
  }
  
  if (error.type === ErrorType.WITHDRAWAL) {
    return "Votre demande de retrait n'a pas pu être traitée. Veuillez réessayer plus tard.";
  }
  
  // Message par défaut si aucun message personnalisé n'est défini
  return error.message || "Une erreur est survenue. Veuillez réessayer.";
}

/**
 * Enregistre les erreurs critiques dans la console et éventuellement dans un service de monitoring
 */
export function logCriticalError(error: any, context: string): void {
  console.error(`[CRITICAL ERROR] ${context}:`, error);
  
  // TODO: Implémenter l'envoi à un service de monitoring comme Sentry
}

/**
 * Vérifie si une action est potentiellement malveillante
 */
export function checkSecurityRisk(action: string, userId: string, data: any): boolean {
  // Exemple simple de détection de comportements suspects
  const riskFactors = [];
  
  // Vérifier les tentatives de retrait multiples rapprochées
  if (action === 'withdrawal' && localStorage.getItem(`lastWithdrawal_${userId}`)) {
    const lastWithdrawal = new Date(localStorage.getItem(`lastWithdrawal_${userId}`) || '');
    const now = new Date();
    const minutesSinceLastAttempt = (now.getTime() - lastWithdrawal.getTime()) / (1000 * 60);
    
    if (minutesSinceLastAttempt < 5) {
      riskFactors.push('multiple_withdrawal_attempts');
    }
  }
  
  // Vérifier les tentatives de session multiples rapprochées
  if (action === 'session' && localStorage.getItem(`lastSession_${userId}`)) {
    const lastSession = new Date(localStorage.getItem(`lastSession_${userId}`) || '');
    const now = new Date();
    const secondsSinceLastAttempt = (now.getTime() - lastSession.getTime()) / 1000;
    
    if (secondsSinceLastAttempt < 2) {
      riskFactors.push('session_spam');
    }
  }
  
  // Si des facteurs de risque sont détectés
  if (riskFactors.length > 0) {
    handleError(
      { message: 'Comportement suspect détecté', code: 'SECURITY_RISK' },
      `Facteurs de risque: ${riskFactors.join(', ')}`,
      ErrorType.SECURITY,
      false // Ne pas afficher de toast pour ne pas alerter les utilisateurs malveillants
    );
    
    // Enregistrer l'horodatage de la tentative
    localStorage.setItem(`securityFlag_${userId}`, new Date().toISOString());
    
    return true;
  }
  
  return false;
}

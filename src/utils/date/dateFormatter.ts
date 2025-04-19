
/**
 * Utilitaires pour la gestion des dates et valeurs basées sur la date
 */

// Formater une date pour le stockage (YYYY-MM-DD)
export const formatDateForStorage = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// Générer une valeur consistante basée sur la date actuelle
export const generateDateBasedValue = (): number => {
  const date = new Date();
  const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  
  // Simple hash function pour générer une valeur numérique à partir de la chaîne de date
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convertir en valeur positive entre 0 et 9999
  return Math.abs(hash % 10000);
};

// Calculer le nombre de jours entre deux dates
export const daysBetween = (date1: Date, date2: Date): number => {
  // Normaliser les dates en supprimant l'heure
  const normalizedDate1 = new Date(date1);
  normalizedDate1.setHours(0, 0, 0, 0);
  
  const normalizedDate2 = new Date(date2);
  normalizedDate2.setHours(0, 0, 0, 0);
  
  // Calculer la différence en millisecondes et convertir en jours
  const timeDiff = Math.abs(normalizedDate2.getTime() - normalizedDate1.getTime());
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
};

// Vérifier si c'est un nouveau jour par rapport à la dernière visite
export const isNewDay = (lastVisitDate: string): boolean => {
  try {
    const lastDate = new Date(lastVisitDate);
    const today = new Date();
    
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return today.getTime() > lastDate.getTime();
  } catch (e) {
    console.error("Error in isNewDay:", e);
    return true; // Par défaut, supposer que c'est un nouveau jour en cas d'erreur
  }
};

// Calculer le temps restant jusqu'à minuit
export const timeUntilMidnight = (): number => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return tomorrow.getTime() - now.getTime();
};

// Formater le temps en minutes et secondes
export const formatTimeRemaining = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes} minutes et ${seconds} secondes`;
};

export default {
  formatDateForStorage,
  generateDateBasedValue,
  daysBetween,
  isNewDay,
  timeUntilMidnight,
  formatTimeRemaining
};

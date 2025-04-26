
import balanceManager from '@/utils/balance/balanceManager';

/**
 * Répare les incohérences dans les données de solde stockées localement
 * en synchronisant toutes les sources avec la valeur la plus élevée
 */
export const repairInconsistentData = (userId?: string | null): void => {
  try {
    // Créer des clés spécifiques à l'utilisateur si un ID est fourni
    const getKey = (baseKey: string): string => {
      return userId ? `${baseKey}_${userId}` : baseKey;
    };
    
    const keys = [
      'currentBalance',
      'lastKnownBalance',
      'highest_balance',
      'lastUpdatedBalance'
    ];
    
    // Collecter toutes les valeurs stockées
    const values = keys.map(key => {
      const storedValue = localStorage.getItem(getKey(key));
      return storedValue ? parseFloat(storedValue) : 0;
    });
    
    // Ajouter également la valeur actuelle de balanceManager
    values.push(balanceManager.getCurrentBalance());
    
    // Trouver la valeur maximale parmi toutes les sources
    const validValues = values.filter(value => !isNaN(value) && value > 0);
    const maxBalance = validValues.length > 0 ? Math.max(...validValues) : 0;
    
    // Si nous avons une valeur valide, synchroniser toutes les sources
    if (maxBalance > 0) {
      // Mettre à jour toutes les valeurs dans localStorage
      keys.forEach(key => {
        localStorage.setItem(getKey(key), maxBalance.toString());
      });
      
      // Mettre à jour également sessionStorage
      sessionStorage.setItem(getKey('currentBalance'), maxBalance.toString());
      
      // Mettre à jour balanceManager avec le contexte utilisateur
      balanceManager.forceBalanceSync(maxBalance, userId);
    }
    
    console.log(`Données de solde réparées: ${maxBalance}€ (userId: ${userId || 'none'})`);
  } catch (error) {
    console.error('Erreur lors de la réparation des données incohérentes:', error);
  }
};

/**
 * Nettoyer toutes les données d'un utilisateur spécifique du localStorage
 */
export const cleanUserData = (userId: string): void => {
  if (!userId) return;
  
  try {
    // Liste des préfixes de clés utilisées pour stocker les données utilisateur
    const keyPrefixes = [
      'currentBalance',
      'lastKnownBalance',
      'highest_balance',
      'lastUpdatedBalance',
      'subscription',
      'lastKnownUsername',
      'daily_session_count',
      'dailyGains'
    ];
    
    // Supprimer toutes les entrées avec ces préfixes pour cet utilisateur
    keyPrefixes.forEach(prefix => {
      localStorage.removeItem(`${prefix}_${userId}`);
      sessionStorage.removeItem(`${prefix}_${userId}`);
    });
    
    console.log(`Données nettoyées pour l'utilisateur: ${userId}`);
  } catch (error) {
    console.error('Erreur lors du nettoyage des données utilisateur:', error);
  }
};

/**
 * Nettoyer les données des autres utilisateurs du localStorage
 */
export const cleanOtherUsersData = (currentUserId: string): void => {
  if (!currentUserId) return;
  
  try {
    // Récupérer toutes les clés du localStorage
    const allKeys = Object.keys(localStorage);
    const userIdPattern = /_[0-9a-f-]{36}$/; // Motif pour identifier les clés avec ID utilisateur
    
    // Filtrer les clés qui contiennent un ID utilisateur
    const userSpecificKeys = allKeys.filter(key => userIdPattern.test(key));
    
    // Pour chaque clé, vérifier si elle appartient à un autre utilisateur
    userSpecificKeys.forEach(key => {
      // Extraire l'ID utilisateur de la clé
      const match = key.match(userIdPattern);
      if (match) {
        const keyUserId = match[0].substring(1); // Supprimer le '_' au début
        
        // Si la clé appartient à un autre utilisateur, la supprimer
        if (keyUserId !== currentUserId) {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
      }
    });
    
    console.log(`Données des autres utilisateurs nettoyées. Utilisateur actuel: ${currentUserId}`);
  } catch (error) {
    console.error('Erreur lors du nettoyage des données des autres utilisateurs:', error);
  }
};

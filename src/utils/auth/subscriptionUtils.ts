
import { supabase } from '@/integrations/supabase/client';
import { refreshSession } from './sessionUtils';

let authChangeCallbacks: Array<(status: boolean) => void> = [];

// Cache pour éviter trop d'appels API
const networkStatusCache = {
  isOnline: true,
  lastChecked: 0,
  dnsStatus: true,
  lastDnsCheck: 0
};

// Vérifie si l'utilisateur a atteint sa limite quotidienne
export const checkDailyLimit = async (userId: string): Promise<boolean> => {
  try {
    // Mettre en cache les résultats pendant 1 minute pour réduire les appels API
    const cacheKey = `daily_limit_${userId}`;
    const cachedResult = sessionStorage.getItem(cacheKey);
    if (cachedResult && Date.now() - parseInt(cachedResult.split(':')[1]) < 60000) {
      return cachedResult.split(':')[0] === 'true';
    }
    
    // Get the user's balance and subscription
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance, subscription, daily_session_count')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking daily limit:', error);
      // En cas d'erreur, considérer que la limite n'est pas atteinte
      return false;
    }
    
    // Check if the user has reached their limit based on subscription
    const subscription = data?.subscription || 'freemium';
    let dailyLimit = 0.5; // Default for freemium
    
    // Set limit based on subscription
    switch (subscription) {
      case 'starter': dailyLimit = 5; break;
      case 'gold': dailyLimit = 15; break;
      case 'elite': dailyLimit = 30; break;
      default: dailyLimit = 0.5; // freemium
    }
    
    // Calculate if limit is reached using transactions from today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: todaysTransactions, error: txError } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .eq('date', today);
      
    if (txError) {
      console.error('Error getting transactions:', txError);
      return false;
    }
    
    const dailyGains = todaysTransactions ? 
      todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0) : 0;
    
    const hasReachedLimit = dailyGains >= dailyLimit;
    
    // Mettre en cache le résultat
    sessionStorage.setItem(cacheKey, `${hasReachedLimit}:${Date.now()}`);
    
    return hasReachedLimit;
  } catch (err) {
    console.error('Exception checking daily limit:', err);
    return false;
  }
};

// Récupère l'abonnement effectif de l'utilisateur
export const getEffectiveSubscription = async (userId: string): Promise<string> => {
  try {
    // Tenter d'abord de récupérer depuis le cache local
    const cachedSubscription = localStorage.getItem('subscription');
    if (cachedSubscription) {
      return cachedSubscription;
    }
    
    // Sinon, chercher dans la base de données
    const { data, error } = await supabase
      .from('user_balances')
      .select('subscription')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error getting subscription:', error);
      return 'freemium'; // Par défaut, retourner 'free'
    }
    
    const subscription = data?.subscription || 'freemium';
    
    // Mettre en cache le résultat
    localStorage.setItem('subscription', subscription);
    
    return subscription;
  } catch (err) {
    console.error('Exception getting subscription:', err);
    return 'freemium';
  }
};

// S'abonne aux changements d'état d'authentification
export const subscribeToAuthChanges = (callback: (status: boolean) => void): void => {
  authChangeCallbacks.push(callback);
};

// Se désabonne des changements d'état d'authentification
export const unsubscribeFromAuthChanges = (callback: (status: boolean) => void): void => {
  authChangeCallbacks = authChangeCallbacks.filter(cb => cb !== callback);
};

// Vérifie si l'utilisateur est authentifié
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord si nous sommes en ligne
    if (!navigator.onLine) {
      console.log('Device is offline, authentication check aborted');
      return false;
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      // Si pas de session ou erreur, essayer de rafraîchir
      const refreshedSession = await refreshSession();
      return !!refreshedSession;
    }
    
    if (data.session.expires_at && Date.now() / 1000 >= data.session.expires_at) {
      // Session expirée, essayer de rafraîchir
      const refreshedSession = await refreshSession();
      return !!refreshedSession;
    }
    
    return true;
  } catch (err) {
    console.error('Error checking authentication:', err);
    return false;
  }
};

// Vérifie si la connexion internet est valide avec un mécanisme amélioré et un cache
export const hasValidConnection = async (forceCheck = false): Promise<boolean> => {
  // Vérifier le cache si pas de vérification forcée
  if (!forceCheck) {
    // Utiliser le cache pour les vérifications fréquentes (moins de 5 secondes)
    const now = Date.now();
    if (now - networkStatusCache.lastChecked < 5000) {
      return networkStatusCache.isOnline && networkStatusCache.dnsStatus;
    }
    
    // Mettre à jour le cache pour l'état online/offline
    networkStatusCache.isOnline = navigator.onLine;
    networkStatusCache.lastChecked = now;
    
    // Si déjà hors ligne, pas besoin de vérifier DNS
    if (!networkStatusCache.isOnline) {
      return false;
    }
    
    // Vérifier le cache DNS moins fréquemment (30 secondes)
    if (now - networkStatusCache.lastDnsCheck < 30000) {
      return networkStatusCache.dnsStatus;
    }
  }
  
  // Vérifier si le navigateur est en ligne
  if (!navigator.onLine) {
    networkStatusCache.isOnline = false;
    networkStatusCache.dnsStatus = false;
    networkStatusCache.lastChecked = Date.now();
    networkStatusCache.lastDnsCheck = Date.now();
    return false;
  }
  
  // Vérifier la résolution DNS en envoyant une requête à plusieurs images connues
  try {
    // Liste de domaines à tester
    const domains = [
      'https://www.google.com/favicon.ico',
      'https://www.cloudflare.com/favicon.ico',
      'https://www.apple.com/favicon.ico',
      'https://api.supabase.io/favicon.ico'
    ];
    
    // Prendre deux domaines au hasard pour plus de fiabilité
    const randomIndices = Array.from({length: 2}, () => Math.floor(Math.random() * domains.length));
    const testPromises = randomIndices.map(index => {
      const testUrl = `${domains[index]}?nocache=${Date.now()}`;
      
      return new Promise<boolean>(resolve => {
        const img = new Image();
        const timeoutId = setTimeout(() => {
          img.onload = img.onerror = null;
          resolve(false);
        }, 5000);
        
        img.onload = () => {
          clearTimeout(timeoutId);
          resolve(true);
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          resolve(false);
        };
        
        img.src = testUrl;
      });
    });
    
    // Considérer la connexion comme valide si au moins un des tests réussit
    const results = await Promise.all(testPromises);
    const isValid = results.some(result => result);
    
    // Mettre à jour le cache
    networkStatusCache.dnsStatus = isValid;
    networkStatusCache.lastDnsCheck = Date.now();
    
    return isValid;
  } catch (error) {
    console.warn('DNS check failed:', error);
    
    // Mettre à jour le cache
    networkStatusCache.dnsStatus = false;
    networkStatusCache.lastDnsCheck = Date.now();
    
    return false;
  }
};

// Nouvelle fonction pour forcer une tentative de reconnexion
export const retryConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    // 1. Vérifier l'état de la connexion
    networkStatusCache.lastChecked = 0; // Reset cache pour forcer une vérification
    networkStatusCache.lastDnsCheck = 0;
    
    const isOnline = navigator.onLine;
    if (!isOnline) {
      return {
        success: false,
        message: "Votre appareil est hors ligne. Activez votre connexion WiFi ou données mobiles."
      };
    }
    
    // 2. Tester différents domaines pour détecter les problèmes DNS spécifiques
    const testDomains = [
      { url: 'https://www.google.com/favicon.ico', name: 'Google' },
      { url: 'https://www.cloudflare.com/favicon.ico', name: 'Cloudflare' },
      { url: 'https://streamgenius.io/favicon.ico', name: 'StreamGenius' }
    ];
    
    const domainTests = await Promise.all(testDomains.map(domain => {
      return new Promise<{domain: string, success: boolean}>(resolve => {
        const img = new Image();
        const timeoutId = setTimeout(() => {
          resolve({domain: domain.name, success: false});
        }, 3000);
        
        img.onload = () => {
          clearTimeout(timeoutId);
          resolve({domain: domain.name, success: true});
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          resolve({domain: domain.name, success: false});
        };
        
        img.src = `${domain.url}?nocache=${Date.now()}`;
      });
    }));
    
    // Analyser les résultats pour diagnostiquer le problème
    const allFailed = domainTests.every(test => !test.success);
    const someSucceeded = domainTests.some(test => test.success);
    const streamGeniusFailed = domainTests.find(t => t.domain === 'StreamGenius')?.success === false;
    
    if (allFailed) {
      return {
        success: false, 
        message: "Problème DNS détecté. Essayez d'utiliser un réseau différent ou les données mobiles."
      };
    }
    
    if (someSucceeded && streamGeniusFailed) {
      return {
        success: false,
        message: "Connexion au serveur StreamGenius impossible. Problème temporaire ou DNS."
      };
    }
    
    // 3. Tester l'API Supabase
    try {
      const { error } = await supabase.from('user_balances').select('id').limit(1);
      if (error) {
        console.warn("API test failed:", error);
        return {
          success: false,
          message: "Connexion au serveur établie mais erreur API. Réessayez dans quelques instants."
        };
      }
    } catch (apiError) {
      console.error("API connection test error:", apiError);
      return {
        success: false,
        message: "Impossible de se connecter à l'API. Vérifiez votre connexion ou pare-feu."
      };
    }
    
    // 4. Si tous les tests passent, mettre à jour le cache et retourner succès
    networkStatusCache.isOnline = true;
    networkStatusCache.dnsStatus = true;
    networkStatusCache.lastChecked = Date.now();
    networkStatusCache.lastDnsCheck = Date.now();
    
    return {
      success: true,
      message: "Connexion rétablie avec succès!"
    };
  } catch (error) {
    console.error("Retry connection error:", error);
    return {
      success: false,
      message: "Erreur lors de la tentative de reconnexion. Veuillez réessayer."
    };
  }
};

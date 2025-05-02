
import { supabase } from '@/integrations/supabase/client';
import { refreshSession } from './sessionUtils';

let authChangeCallbacks: Array<(status: boolean) => void> = [];

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

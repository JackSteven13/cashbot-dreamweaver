
type BalanceState = {
  lastKnownBalance: number;
  dailyGains: number;
  lastUpdated: string;
  userId?: string;
};

type StateSubscriber = (state: BalanceState) => void;

class BalanceManager {
  private state: BalanceState = {
    lastKnownBalance: 0,
    dailyGains: 0,
    lastUpdated: new Date().toISOString(),
    userId: undefined
  };
  
  private subscribers: StateSubscriber[] = [];
  private isInitialized: boolean = false;

  constructor() {
    // Tenter de récupérer l'état depuis localStorage au démarrage
    this.loadState();
  }

  private loadState() {
    try {
      const { data: { session } } = require('@/integrations/supabase/client').supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (userId) {
        // Charger l'état spécifique à l'utilisateur
        const userStateKey = `balanceState_${userId}`;
        const storedState = localStorage.getItem(userStateKey);
        
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          // Vérifier que l'état appartient au bon utilisateur
          if (parsedState.userId === userId) {
            this.state = parsedState;
            
            // Vérifier aussi les valeurs spécifiques à l'utilisateur
            const userBalanceKey = `user_balance_${userId}`;
            const userHighestBalanceKey = `highest_balance_${userId}`;
            
            const storedBalance = localStorage.getItem(userBalanceKey);
            const storedHighest = localStorage.getItem(userHighestBalanceKey);
            
            // Utiliser la valeur la plus élevée
            if (storedBalance || storedHighest) {
              const parsedBalance = storedBalance ? parseFloat(storedBalance) : 0;
              const parsedHighest = storedHighest ? parseFloat(storedHighest) : 0;
              
              const maxBalance = Math.max(
                parsedBalance,
                parsedHighest,
                this.state.lastKnownBalance
              );
              
              if (maxBalance > this.state.lastKnownBalance) {
                this.state.lastKnownBalance = maxBalance;
                console.log(`[BalanceManager] Loaded higher balance from localStorage: ${maxBalance}`);
              }
            }
          } else {
            console.warn(`[BalanceManager] Found state for different user, ignoring`);
            // S'assurer que l'état actuel est associé au bon utilisateur
            this.state.userId = userId;
          }
        } else {
          // S'assurer que l'état actuel est associé au bon utilisateur
          this.state.userId = userId;
        }
      }
    } catch (e) {
      console.error("Error loading balance state:", e);
    }
  }

  private saveState() {
    try {
      if (this.state.userId) {
        const userStateKey = `balanceState_${this.state.userId}`;
        localStorage.setItem(userStateKey, JSON.stringify(this.state));
      }
    } catch (e) {
      console.error("Error saving balance state:", e);
    }
  }

  public initialize(initialBalance: number, userId?: string) {
    try {
      // Si un userId est fourni, l'utiliser, sinon essayer de le récupérer
      const effectiveUserId = userId || (() => {
        try {
          const { data: { session } } = require('@/integrations/supabase/client').supabase.auth.getSession();
          return session?.user?.id;
        } catch (e) {
          return undefined;
        }
      })();
      
      if (effectiveUserId) {
        // Si l'utilisateur a changé, réinitialiser l'état
        if (this.state.userId && this.state.userId !== effectiveUserId) {
          console.log(`[BalanceManager] User changed from ${this.state.userId} to ${effectiveUserId}, resetting state`);
          this.state = {
            lastKnownBalance: initialBalance,
            dailyGains: 0,
            lastUpdated: new Date().toISOString(),
            userId: effectiveUserId
          };
          this.isInitialized = true;
          this.saveState();
          this.notifySubscribers();
          return;
        }
        
        // Mettre à jour l'ID utilisateur si nécessaire
        if (!this.state.userId) {
          this.state.userId = effectiveUserId;
        }
      }
      
      // Si déjà initialisé avec une valeur plus élevée, conserver cette valeur
      if (this.isInitialized && this.state.lastKnownBalance >= initialBalance) {
        console.log(`[BalanceManager] Already initialized with higher balance (${this.state.lastKnownBalance}), ignoring ${initialBalance}`);
        return;
      }
      
      // Sinon, mettre à jour avec la nouvelle valeur
      console.log(`[BalanceManager] Setting balance to: ${initialBalance}`);
      this.state.lastKnownBalance = initialBalance;
      this.state.lastUpdated = new Date().toISOString();
      this.isInitialized = true;
      
      this.saveState();
      this.notifySubscribers();
    } catch (e) {
      console.error("Error initializing balance:", e);
    }
  }

  public updateBalance(gain: number) {
    // Si le gestionnaire n'est pas initialisé, on récupère d'abord l'état
    if (!this.isInitialized) {
      this.loadState();
    }
    
    const newBalance = parseFloat((this.state.lastKnownBalance + gain).toFixed(2));
    
    this.state.lastKnownBalance = newBalance;
    this.state.dailyGains += gain;
    this.state.lastUpdated = new Date().toISOString();
    
    this.saveState();
    this.notifySubscribers();
  }

  public resetBalance() {
    this.state.lastKnownBalance = 0;
    this.state.lastUpdated = new Date().toISOString();
    
    this.saveState();
    this.notifySubscribers();
    
    window.dispatchEvent(new CustomEvent('balance:reset-complete', {
      detail: {
        userId: this.state.userId
      }
    }));
  }

  public resetDailyCounters() {
    this.state.dailyGains = 0;
    this.state.lastUpdated = new Date().toISOString();
    
    this.saveState();
    this.notifySubscribers();
  }

  public getCurrentBalance(): number {
    return this.state.lastKnownBalance;
  }

  public subscribe(callback: StateSubscriber): () => void {
    this.subscribers.push(callback);
    
    // Appeler immédiatement avec l'état actuel
    callback(this.state);
    
    // Retourner une fonction de désinscription
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
    
    // Émettre un événement global avec l'ID utilisateur
    window.dispatchEvent(new CustomEvent('balance:consistent-update', {
      detail: {
        currentBalance: this.state.lastKnownBalance,
        highestBalance: this.state.lastKnownBalance,
        userId: this.state.userId
      }
    }));
  }
}

export const balanceManager = new BalanceManager();

// Fonction utilitaire pour obtenir le solde maximum enregistré en localStorage
export const getHighestBalance = (): number => {
  try {
    // Récupérer l'ID utilisateur actuel
    const { data: { session } } = require('@/integrations/supabase/client').supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return 0;
    }
    
    // Utiliser uniquement les clés spécifiques à l'utilisateur
    const userBalanceKey = `user_balance_${userId}`;
    const userHighestBalanceKey = `highest_balance_${userId}`;
    const userLastKnownBalanceKey = `last_balance_${userId}`;
    
    // Rechercher dans toutes les sources
    const sources = [
      localStorage.getItem(userBalanceKey),
      localStorage.getItem(userHighestBalanceKey),
      localStorage.getItem(userLastKnownBalanceKey)
    ];
    
    // Trouver la valeur maximale
    let highestValue = 0;
    for (const source of sources) {
      if (source) {
        const parsed = parseFloat(source);
        if (!isNaN(parsed) && parsed > highestValue) {
          highestValue = parsed;
        }
      }
    }
    
    return highestValue;
  } catch (e) {
    console.error("Error getting highest balance:", e);
    return 0;
  }
};

// Fonction utilitaire pour nettoyer toutes les données de solde d'un utilisateur
export const cleanupUserBalanceData = (userId: string): void => {
  if (!userId) return;
  
  try {
    // Nettoyer les clés spécifiques à l'utilisateur
    localStorage.removeItem(`balanceState_${userId}`);
    localStorage.removeItem(`user_balance_${userId}`);
    localStorage.removeItem(`highest_balance_${userId}`);
    localStorage.removeItem(`last_balance_${userId}`);
    
    console.log(`[BalanceManager] Cleaned up data for user ${userId}`);
  } catch (e) {
    console.error("Error cleaning up user balance data:", e);
  }
};


/**
 * Système de gestion du solde stable qui maintient une valeur cohérente
 * et permet aux composants de s'abonner aux modifications
 */

type BalanceListener = (newBalance: number) => void;

class StableBalance {
  private balance: number = 0;
  private listeners: BalanceListener[] = [];
  private userId: string | null = null;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialiser le solde depuis localStorage
   */
  private initialize(): void {
    try {
      // Récupérer l'ID utilisateur actuel
      this.userId = localStorage.getItem('lastKnownUserId');
      
      // Utiliser une clé spécifique à l'utilisateur si disponible
      const storageKey = this.userId ? `stableBalance_${this.userId}` : 'stableBalance';
      const storedBalance = localStorage.getItem(storageKey);
      
      // Récupérer également d'autres sources potentielles
      const currentBalanceKey = this.userId ? `currentBalance_${this.userId}` : 'currentBalance';
      const lastKnownBalanceKey = this.userId ? `lastKnownBalance_${this.userId}` : 'lastKnownBalance';
      const highestBalanceKey = this.userId ? `highest_balance_${this.userId}` : 'highest_balance';
      
      const currentBalance = localStorage.getItem(currentBalanceKey);
      const lastKnownBalance = localStorage.getItem(lastKnownBalanceKey);
      const highestBalance = localStorage.getItem(highestBalanceKey);
      
      // Collecter toutes les sources et trouver le maximum
      const sources = [
        storedBalance ? parseFloat(storedBalance) : 0,
        currentBalance ? parseFloat(currentBalance) : 0,
        lastKnownBalance ? parseFloat(lastKnownBalance) : 0,
        highestBalance ? parseFloat(highestBalance) : 0
      ];
      
      // Filtrer les valeurs valides
      const validSources = sources.filter(value => !isNaN(value) && value > 0);
      
      // Utiliser la valeur maximale ou 0 si aucune valeur valide
      this.balance = validSources.length > 0 ? Math.max(...validSources) : 0;
      
      // Stocker la valeur initiale
      this.persistBalance();
    } catch (e) {
      console.error('Error initializing stable balance:', e);
    }
  }
  
  /**
   * Persister le solde dans localStorage
   */
  private persistBalance(): void {
    try {
      // Utiliser une clé spécifique à l'utilisateur si disponible
      const storageKey = this.userId ? `stableBalance_${this.userId}` : 'stableBalance';
      localStorage.setItem(storageKey, this.balance.toString());
    } catch (e) {
      console.error('Error persisting stable balance:', e);
    }
  }
  
  /**
   * Définir l'ID utilisateur
   */
  public setUserId(userId: string | null): void {
    if (this.userId !== userId) {
      console.log(`Stable balance: changing user ID from ${this.userId || 'none'} to ${userId || 'none'}`);
      this.userId = userId;
      
      // Réinitialiser avec les valeurs de cet utilisateur
      this.initialize();
    }
  }
  
  /**
   * Obtenir le solde actuel
   */
  public getBalance(): number {
    return this.balance;
  }
  
  /**
   * Définir le solde et notifier les abonnés
   */
  public setBalance(newBalance: number): void {
    try {
      // Vérifier si la valeur est valide
      if (typeof newBalance !== 'number' || isNaN(newBalance)) {
        console.error(`Invalid balance value: ${newBalance}`);
        return;
      }
      
      // Ne mettre à jour que si la valeur a changé
      if (newBalance !== this.balance) {
        console.log(`Stable balance updated: ${this.balance} -> ${newBalance} (User: ${this.userId || 'none'})`);
        this.balance = newBalance;
        
        // Persister la nouvelle valeur
        this.persistBalance();
        
        // Notifier tous les abonnés
        this.notifyListeners();
      }
    } catch (e) {
      console.error('Error setting stable balance:', e);
    }
  }
  
  /**
   * Ajouter un écouteur pour les modifications de solde
   */
  public addListener(listener: BalanceListener): () => void {
    this.listeners.push(listener);
    
    // Retourner une fonction pour désabonner
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notifier tous les abonnés du nouveau solde
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.balance);
      } catch (e) {
        console.error('Error notifying balance listener:', e);
      }
    });
  }
}

// Exporter une instance unique
const stableBalance = new StableBalance();
export default stableBalance;

class BalanceManager {
  private currentBalance: number = 0;
  private dailyGains: number = 0;
  private highestBalance: number = 0;
  private userId: string | null = null;

  constructor() {
    this.loadBalanceFromStorage();
    this.setupEventListeners();
  }

  private loadBalanceFromStorage() {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      const storedDailyGains = localStorage.getItem('dailyGains');
      const storedHighestBalance = localStorage.getItem('highestBalance');

      this.currentBalance = storedBalance ? parseFloat(storedBalance) : 0;
      this.dailyGains = storedDailyGains ? parseFloat(storedDailyGains) : 0;
      this.highestBalance = storedHighestBalance ? parseFloat(storedHighestBalance) : 0;
      
      // If the current balance is higher than the stored highest balance, update it
      if (this.currentBalance > this.highestBalance) {
        this.highestBalance = this.currentBalance;
        localStorage.setItem('highestBalance', this.highestBalance.toString());
      }
    } catch (e) {
      console.error('Error loading balance from storage:', e);
      this.currentBalance = 0;
      this.dailyGains = 0;
      this.highestBalance = 0;
    }
  }

  private setupEventListeners() {
    window.addEventListener('balance:update', (e: any) => {
      const amount = e.detail?.amount || 0;
      this.updateBalance(amount);
    });

    window.addEventListener('dailyGains:reset', () => {
      this.resetDailyGains();
    });

    window.addEventListener('dailyGains:updated', (e: any) => {
      const gains = e.detail?.gains || 0;
      this.setDailyGains(gains);
    });
  }

  updateBalance(amount: number) {
    this.currentBalance += amount;
    localStorage.setItem('currentBalance', this.currentBalance.toString());
    
    // Update highest balance if needed
    if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
      localStorage.setItem('highestBalance', this.highestBalance.toString());
    }
  }

  forceBalanceSync(balance: number) {
    this.currentBalance = balance;
    localStorage.setItem('currentBalance', this.currentBalance.toString());
    
    // Update highest balance if needed
    if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
      localStorage.setItem('highestBalance', this.highestBalance.toString());
    }
  }

  getCurrentBalance(): number {
    return this.currentBalance;
  }
  
  getHighestBalance(): number {
    return this.highestBalance;
  }

  addDailyGain(amount: number) {
    this.dailyGains += amount;
    localStorage.setItem('dailyGains', this.dailyGains.toString());
  }

  setDailyGains(amount: number) {
    this.dailyGains = amount;
    localStorage.setItem('dailyGains', this.dailyGains.toString());
  }

  getDailyGains(): number {
    return this.dailyGains;
  }

  resetDailyGains() {
    this.dailyGains = 0;
    localStorage.setItem('dailyGains', '0');
  }
  
  // User switch/cleanup functions
  setUserId(id: string) {
    this.userId = id;
  }
  
  cleanupUserBalanceData() {
    // Reset all balances and state when user changes
    this.currentBalance = 0;
    this.dailyGains = 0;
    this.highestBalance = 0;
    this.userId = null;
    
    // Clear localStorage keys related to balance
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('dailyGains');
    localStorage.removeItem('highestBalance');
    localStorage.removeItem('lastResetTime');
    localStorage.removeItem('dailySessionCount');
    
    console.log('User balance data cleaned up successfully');
  }
}

const balanceManager = new BalanceManager();
export default balanceManager;

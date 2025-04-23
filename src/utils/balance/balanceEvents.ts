
import { BalanceWatcher } from './types';

export class BalanceEventManager {
  private watchers: BalanceWatcher[] = [];

  addWatcher(callback: BalanceWatcher): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }

  notifyWatchers(newBalance: number): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(newBalance);
      } catch (e) {
        console.error("Error notifying balance watcher:", e);
      }
    });
  }

  dispatchBalanceUpdate(newBalance: number, userId: string | null): void {
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: {
        newBalance,
        userId,
        timestamp: Date.now()
      }
    }));
  }
}

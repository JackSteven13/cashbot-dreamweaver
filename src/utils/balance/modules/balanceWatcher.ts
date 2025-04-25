
export class BalanceWatcher {
  private watchers: Array<(newBalance: number) => void> = [];
  
  addWatcher(callback: (newBalance: number) => void): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(watcher => watcher !== callback);
    };
  }
  
  notifyWatchers(newBalance: number): void {
    this.watchers.forEach(callback => {
      try {
        callback(newBalance);
      } catch (e) {
        console.error('Error in balance watcher callback:', e);
      }
    });
  }
}

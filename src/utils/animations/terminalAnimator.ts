
type TerminalAnimatorOptions = {
  background?: boolean;
  noEffects?: boolean;
};

/**
 * Create a terminal animation sequence that can be displayed in the dashboard
 */
export const createTerminalSequence = (initialLines: string[] = []) => {
  let lines = [...initialLines];
  
  // Trigger an event to start terminal analysis
  window.dispatchEvent(new CustomEvent('dashboard:analysis-start'));

  return {
    addLine(line: string) {
      lines.push(line);
      // Dispatch an event to update the terminal in the dashboard
      window.dispatchEvent(new CustomEvent('dashboard:terminal-update', { 
        detail: { line } 
      }));
    },
    
    complete(gain: number) {
      window.dispatchEvent(new CustomEvent('dashboard:analysis-complete', { 
        detail: { gain } 
      }));
    },
    
    getLines() {
      return [...lines];
    }
  };
};

/**
 * Create a terminal animation sequence that runs in the background (no loading screen)
 */
export const createBackgroundTerminalSequence = (initialLines: string[] = [], forceBackground: boolean = false) => {
  let lines = [...initialLines];
  
  // Trigger an event to start terminal analysis in background mode
  window.dispatchEvent(new CustomEvent('dashboard:analysis-start', { 
    detail: { 
      background: true,
      forceBackground: forceBackground 
    } 
  }));

  return {
    addLine(line: string) {
      lines.push(line);
      // Dispatch an event to update the terminal in the dashboard
      window.dispatchEvent(new CustomEvent('dashboard:terminal-update', { 
        detail: { 
          line,
          background: true,
          forceBackground: forceBackground
        } 
      }));
    },
    
    complete(gain: number) {
      window.dispatchEvent(new CustomEvent('dashboard:analysis-complete', { 
        detail: { 
          gain, 
          background: true,
          forceBackground: forceBackground
        } 
      }));
    },
    
    getLines() {
      return [...lines];
    }
  };
};

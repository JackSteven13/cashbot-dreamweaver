
/**
 * Utility class to handle terminal animations in the background
 * without requiring a full loading screen
 */
export class TerminalAnimator {
  private static instance: TerminalAnimator;
  private isAnimating: boolean = false;
  private lines: string[] = [];
  
  private constructor() {}
  
  public static getInstance(): TerminalAnimator {
    if (!TerminalAnimator.instance) {
      TerminalAnimator.instance = new TerminalAnimator();
    }
    return TerminalAnimator.instance;
  }
  
  /**
   * Start a terminal animation sequence in the background
   * @param initialLines Optional initial lines to show
   * @returns A control object to update or complete the animation
   */
  public startAnimation(initialLines: string[] = []): TerminalAnimationControl {
    this.isAnimating = true;
    this.lines = [...initialLines];
    
    // Dispatch background event to show terminal without loading screen
    window.dispatchEvent(new CustomEvent('dashboard:terminal-update', {
      detail: {
        line: initialLines[0] || "Initialisation de l'analyse...",
        background: true,
        animate: true
      }
    }));
    
    // Return a control interface for this animation
    return {
      addLine: (line: string) => this.addAnimationLine(line),
      complete: (gain: number = 0) => this.completeAnimation(gain)
    };
  }
  
  /**
   * Add a line to the ongoing animation
   * @param line Text line to add
   */
  private addAnimationLine(line: string): void {
    if (!this.isAnimating) return;
    
    this.lines.push(line);
    
    // Update the terminal without triggering loading screen
    window.dispatchEvent(new CustomEvent('dashboard:terminal-update', {
      detail: {
        line,
        background: true,
        animate: true
      }
    }));
  }
  
  /**
   * Complete the animation and show the gain
   * @param gain Amount gained during the process
   */
  private completeAnimation(gain: number = 0): void {
    if (!this.isAnimating) return;
    
    // Mark as complete with background flag to prevent loading screen
    window.dispatchEvent(new CustomEvent('dashboard:analysis-complete', {
      detail: {
        gain,
        background: true,
        animate: true
      }
    }));
    
    this.isAnimating = false;
    this.lines = [];
  }
}

/**
 * Interface for controlling a terminal animation
 */
export interface TerminalAnimationControl {
  addLine: (line: string) => void;
  complete: (gain?: number) => void;
}

/**
 * Helper function to create a terminal animation sequence
 * that won't trigger loading screens
 */
export const createBackgroundTerminalSequence = (
  initialLines: string[] = []
): TerminalAnimationControl => {
  return TerminalAnimator.getInstance().startAnimation(initialLines);
};

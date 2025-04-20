
/**
 * Utilitaires pour les animations du terminal dans le dashboard
 */

/**
 * Interface pour une séquence d'animation du terminal
 */
interface TerminalSequence {
  add: (text: string) => void;
  complete: (result?: number) => void;
  cancel: () => void;
}

/**
 * Crée une séquence d'animation de terminal en arrière-plan
 */
export const createBackgroundTerminalSequence = (
  lines: string[] = [],
  animate: boolean = true
): TerminalSequence => {
  // Identifiant unique pour cette séquence
  const sequenceId = Math.random().toString(36).substring(2, 9);
  
  // Ajouter les lignes initiales
  lines.forEach(line => {
    window.dispatchEvent(new CustomEvent('terminal:update', {
      detail: {
        id: sequenceId,
        message: line,
        background: true,
        animate
      }
    }));
  });
  
  return {
    // Ajouter une nouvelle ligne à la séquence
    add: (text: string): void => {
      window.dispatchEvent(new CustomEvent('terminal:update', {
        detail: {
          id: sequenceId,
          message: text,
          background: true,
          animate
        }
      }));
    },
    
    // Terminer la séquence avec un résultat facultatif
    complete: (result?: number): void => {
      if (typeof result === 'number') {
        window.dispatchEvent(new CustomEvent('terminal:update', {
          detail: {
            id: sequenceId,
            message: `Résultat: +${result.toFixed(2)}€`,
            status: 'success',
            background: true,
            animate,
            complete: true
          }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('terminal:update', {
          detail: {
            id: sequenceId,
            message: 'Opération terminée',
            status: 'info',
            background: true,
            animate,
            complete: true
          }
        }));
      }
    },
    
    // Annuler la séquence
    cancel: (): void => {
      window.dispatchEvent(new CustomEvent('terminal:update', {
        detail: {
          id: sequenceId,
          message: 'Opération annulée',
          status: 'error',
          background: true,
          animate,
          complete: true
        }
      }));
    }
  };
};

/**
 * Crée une animation de type "typing" dans le terminal
 */
export const createTypingAnimation = (
  text: string,
  options: {
    speed?: number;
    onComplete?: () => void;
  } = {}
): (() => void) => {
  const { speed = 50, onComplete } = options;
  const words = text.split(' ');
  let wordIndex = 0;
  
  const sequenceId = Math.random().toString(36).substring(2, 9);
  
  // Afficher le premier mot
  window.dispatchEvent(new CustomEvent('terminal:typing', {
    detail: {
      id: sequenceId,
      text: words[0],
      isComplete: false
    }
  }));
  
  // Afficher progressivement les mots suivants
  const interval = setInterval(() => {
    wordIndex++;
    
    if (wordIndex >= words.length) {
      clearInterval(interval);
      // Animation terminée
      window.dispatchEvent(new CustomEvent('terminal:typing', {
        detail: {
          id: sequenceId,
          text: text,
          isComplete: true
        }
      }));
      
      if (onComplete) {
        onComplete();
      }
      return;
    }
    
    // Afficher progressivement les mots
    window.dispatchEvent(new CustomEvent('terminal:typing', {
      detail: {
        id: sequenceId,
        text: words.slice(0, wordIndex + 1).join(' '),
        isComplete: false
      }
    }));
  }, speed);
  
  // Retourne la fonction de nettoyage
  return () => {
    clearInterval(interval);
  };
};


/**
 * Gestionnaire d'animation de terminal pour les simulations d'analyse
 */

interface TerminalSequence {
  addLine: (text: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  complete: (gain?: number) => void;
}

/**
 * Crée une séquence d'animation de terminal en arrière-plan
 */
export const createBackgroundTerminalSequence = (
  initialLines: string[] = [],
  silent: boolean = false
): TerminalSequence => {
  // Tableau pour stocker les lignes de terminal
  const lines = [...initialLines];
  
  // Déclencher l'événement initial avec animation immédiate
  if (!silent) {
    console.log("Démarrage d'une animation de terminal avec les lignes:", initialLines);
    
    window.dispatchEvent(new CustomEvent('terminal:show', {
      detail: {
        lines: initialLines.map(text => ({ text, type: 'info' })),
        isComplete: false
      }
    }));
    
    // Déclencher également l'événement d'analyse pour les animations
    window.dispatchEvent(new CustomEvent('dashboard:analysis-start', {
      detail: { animate: true, timestamp: Date.now() }
    }));
  }

  /**
   * Ajoute une ligne au terminal
   */
  const addLine = (text: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    lines.push(text);
    
    if (!silent) {
      console.log(`Terminal: ${type.toUpperCase()} - ${text}`);
      
      // Mettre à jour l'affichage du terminal
      window.dispatchEvent(new CustomEvent('terminal:update', {
        detail: {
          lines: lines.map(l => ({ text: l, type: 'info' })),
          lastLine: { text, type },
          isComplete: false
        }
      }));
    }
  };

  /**
   * Termine la séquence d'animation et affiche le gain optionnel
   */
  const complete = (gain: number = 0) => {
    if (gain > 0) {
      lines.push(`Analyse terminée avec succès: +${gain.toFixed(2)}€`);
    } else {
      lines.push('Analyse terminée.');
    }
    
    if (!silent) {
      // Mettre à jour l'affichage du terminal avec l'état complet
      window.dispatchEvent(new CustomEvent('terminal:complete', {
        detail: {
          lines: lines.map(text => ({ text, type: gain > 0 ? 'success' : 'info' })),
          gain,
          isComplete: true
        }
      }));
      
      // Déclencher l'événement de fin d'analyse
      window.dispatchEvent(new CustomEvent('dashboard:analysis-complete', {
        detail: { gain, animate: true, timestamp: Date.now() }
      }));
    }
  };

  return {
    addLine,
    complete
  };
};

/**
 * Fonction pour créer une animation de terminal complète avec progression
 */
export const createTerminalAnimation = (
  title: string = 'Analyse en cours',
  duration: number = 3000,
  gain: number = 0.1
) => {
  const sequence = createBackgroundTerminalSequence([title]);
  
  // Ajouter des lignes avec un délai pour simuler une progression
  setTimeout(() => sequence.addLine('Initialisation de l\'analyse...'), 500);
  setTimeout(() => sequence.addLine('Traitement des données vidéo...'), 1200);
  setTimeout(() => sequence.addLine('Optimisation des résultats...'), 2000);
  
  // Terminer la séquence après la durée spécifiée
  setTimeout(() => sequence.complete(gain), duration);
  
  return sequence;
};

/**
 * Fonction pour déclencher une notification de gain
 */
export const triggerGainNotification = (gain: number) => {
  window.dispatchEvent(new CustomEvent('balance:update', {
    detail: { amount: gain, animate: true }
  }));
};


import { useState, useEffect } from 'react';

export const useTerminalAnalysis = () => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    // Listen for terminal updates - these are in-dashboard updates that don't trigger loading screens
    const handleTerminalUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const line = customEvent.detail?.line;
      
      if (line) {
        setTerminalLines(prev => [...prev, line]);
        setShowAnalysis(true);
      }
    };

    // Listen for analysis start events
    const handleAnalysisStart = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // Only show analysis UI if not running in background
      if (!customEvent.detail?.background) {
        setShowAnalysis(true);
        setAnalysisComplete(false);
        setTerminalLines([
          'Initialisation de l\'analyse réseau...',
        ]);
      }
    };

    // Listen for analysis complete events
    const handleAnalysisComplete = (event: Event) => {
      const customEvent = event as CustomEvent;
      const gain = customEvent.detail?.gain || 0;
      
      // Only update UI if not running in background or if terminal is already showing
      if (!customEvent.detail?.background || showAnalysis) {
        setTerminalLines(prev => [
          ...prev, 
          `Analyse terminée avec succès! Revenus générés: ${gain.toFixed(2)}€`
        ]);
        setAnalysisComplete(true);
        
        // Hide terminal after 5 seconds
        setTimeout(() => {
          setShowAnalysis(false);
          // Reset terminal lines after animation completes
          setTimeout(() => {
            setTerminalLines([]);
            setAnalysisComplete(false);
          }, 300);
        }, 5000);
      }
    };

    window.addEventListener('dashboard:terminal-update', handleTerminalUpdate);
    window.addEventListener('dashboard:analysis-start', handleAnalysisStart);
    window.addEventListener('dashboard:analysis-complete', handleAnalysisComplete);

    return () => {
      window.removeEventListener('dashboard:terminal-update', handleTerminalUpdate);
      window.removeEventListener('dashboard:analysis-start', handleAnalysisStart);
      window.removeEventListener('dashboard:analysis-complete', handleAnalysisComplete);
    };
  }, [showAnalysis]);

  return { showAnalysis, terminalLines, analysisComplete };
};

export default useTerminalAnalysis;

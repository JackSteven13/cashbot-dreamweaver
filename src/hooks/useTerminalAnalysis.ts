
import { useState, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { getParisTime, calculateTimeUntilMidnight } from '@/utils/timeUtils';

export const useTerminalAnalysis = () => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [countdownTime, setCountdownTime] = useState<string>('');
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);

  // Format countdown time as HH:MM:SS
  const formatCountdown = (milliseconds: number): string => {
    if (milliseconds <= 0) return "00:00:00";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Listen for terminal updates - these are in-dashboard updates that don't trigger loading screens
    const handleTerminalUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const line = customEvent.detail?.line;
      const isBackground = customEvent.detail?.background === true;
      
      if (line) {
        setTerminalLines(prev => [...prev, line]);
        setShowAnalysis(true);
        setIsBackgroundMode(isBackground);
      }
    };

    // Listen for analysis start events
    const handleAnalysisStart = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // CRITIQUE: Toujours vérifier le flag background - correction cruciale pour éviter l'écran de chargement
      const isBackgroundProcess = customEvent.detail?.background === true;
      
      // N'afficher l'UI d'analyse que si elle ne s'exécute pas en arrière-plan
      if (isBackgroundProcess) {
        console.log("Skipping loading screen for background analysis-start event");
        setShowAnalysis(true);
        setIsBackgroundMode(true);
        setAnalysisComplete(false);
        setTerminalLines([
          'Initialisation de l\'analyse réseau...',
        ]);
      } else {
        // Ce chemin ne doit pas être pris pour les revenus générés automatiquement,
        // uniquement pour les actions manuelles comme les clics sur les boutons
        setShowAnalysis(true);
        setIsBackgroundMode(false);
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
      const isBackgroundProcess = customEvent.detail?.background === true;
      
      // Pour les processus en arrière-plan et au premier plan, mettre à jour le terminal
      setTerminalLines(prev => [
        ...prev, 
        `Analyse terminée avec succès! Revenus générés: ${gain.toFixed(2)}€`
      ]);
      setAnalysisComplete(true);
      setIsBackgroundMode(isBackgroundProcess);
      
      // Masquer le terminal après 5 secondes pour les processus en arrière-plan,
      // mais garder visible plus longtemps pour les processus au premier plan
      const hideDelay = isBackgroundProcess ? 5000 : 8000;
      
      setTimeout(() => {
        setShowAnalysis(false);
        // Réinitialiser les lignes du terminal après la fin de l'animation
        setTimeout(() => {
          setTerminalLines([]);
          setAnalysisComplete(false);
        }, 300);
      }, hideDelay);
    };

    // Listen for daily limit reached events
    const handleLimitReached = (event: Event) => {
      const customEvent = event as CustomEvent;
      const subscription = customEvent.detail?.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const isBackground = customEvent.detail?.background === true;
      
      setLimitReached(true);
      setShowAnalysis(true);
      setIsBackgroundMode(isBackground);
      setTerminalLines([
        `Limite journalière de ${dailyLimit}€ atteinte.`,
        'Le bot est temporairement hors-service.'
      ]);
      
      // Calculate time until midnight in Paris time zone
      const timeUntilMidnight = calculateTimeUntilMidnight();
      setCountdownTime(formatCountdown(timeUntilMidnight));
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdownTime(prev => {
          // Parse previous time
          const [hours, minutes, seconds] = prev.split(':').map(Number);
          let totalSeconds = hours * 3600 + minutes * 60 + seconds;
          
          // Decrement by 1 second
          totalSeconds -= 1;
          
          if (totalSeconds <= 0) {
            clearInterval(timer);
            setLimitReached(false);
            setShowAnalysis(false);
            return "00:00:00";
          }
          
          // Format back to HH:MM:SS
          const newHours = Math.floor(totalSeconds / 3600);
          const newMinutes = Math.floor((totalSeconds % 3600) / 60);
          const newSeconds = totalSeconds % 60;
          
          return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    };

    window.addEventListener('dashboard:terminal-update', handleTerminalUpdate);
    window.addEventListener('dashboard:analysis-start', handleAnalysisStart);
    window.addEventListener('dashboard:analysis-complete', handleAnalysisComplete);
    window.addEventListener('dashboard:limit-reached', handleLimitReached);

    return () => {
      window.removeEventListener('dashboard:terminal-update', handleTerminalUpdate);
      window.removeEventListener('dashboard:analysis-start', handleAnalysisStart);
      window.removeEventListener('dashboard:analysis-complete', handleAnalysisComplete);
      window.removeEventListener('dashboard:limit-reached', handleLimitReached);
    };
  }, [showAnalysis]);

  return { 
    showAnalysis, 
    terminalLines, 
    analysisComplete, 
    limitReached, 
    countdownTime,
    isBackgroundMode
  };
};

export default useTerminalAnalysis;

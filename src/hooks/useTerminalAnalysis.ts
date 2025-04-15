
import { useState, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { getParisTime, calculateTimeUntilMidnight } from '@/utils/timeUtils';

export const useTerminalAnalysis = () => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [countdownTime, setCountdownTime] = useState<string>('');

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
    // Listen for terminal updates
    const handleTerminalUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const line = customEvent.detail?.line;
      
      if (line) {
        setTerminalLines(prev => [...prev, line]);
        setShowAnalysis(true);
      }
    };

    // Listen for analysis start events with engaging output
    const handleAnalysisStart = () => {
      setShowAnalysis(true);
      setAnalysisComplete(false);
      
      const initialLines = [
        'Initialisation de l\'analyse réseau...',
        'Connexion aux sources de données en cours...',
        'Analyseur d\'intelligence artificielle activé',
        'Scan des opportunités de revenus en cours...'
      ];
      
      // Add lines with delays for more realistic output
      setTerminalLines([initialLines[0]]);
      
      let lineIndex = 1;
      const addLine = () => {
        if (lineIndex < initialLines.length) {
          setTerminalLines(prev => [...prev, initialLines[lineIndex]]);
          lineIndex++;
          setTimeout(addLine, 400 + Math.random() * 300);
        }
      };
      
      setTimeout(addLine, 300);
    };

    // Listen for analysis complete events
    const handleAnalysisComplete = (event: Event) => {
      const customEvent = event as CustomEvent;
      const gain = customEvent.detail?.gain || 0;
      
      // Add completion lines gradually
      const completionLines = [
        'Analyse complète des données terminée',
        'Machine learning appliqué aux patterns publicitaires',
        `✓ Revenus générés: ${gain.toFixed(2)}€`,
        'Session complétée avec succès'
      ];
      
      // First add processing lines
      setTerminalLines(prev => [...prev, completionLines[0]]);
      
      // Then add the remaining lines with delays
      setTimeout(() => {
        setTerminalLines(prev => [...prev, completionLines[1]]);
        
        setTimeout(() => {
          setTerminalLines(prev => [...prev, completionLines[2]]);
          
          setTimeout(() => {
            setTerminalLines(prev => [...prev, completionLines[3]]);
            setAnalysisComplete(true);
          }, 500);
        }, 400);
      }, 300);
      
      // Hide terminal after delay for better UX
      const hideDelay = 4000;
      setTimeout(() => {
        setShowAnalysis(false);
        
        // Reset terminal lines after animation ends
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
      
      setLimitReached(true);
      setShowAnalysis(true);
      
      setTerminalLines([
        `Limite journalière de ${dailyLimit}€ atteinte.`,
        'Algorithmes de génération de revenus en pause.',
        'Réinitialisation automatique prévue à minuit.',
        'Passez à une offre supérieure pour augmenter votre limite quotidienne.'
      ]);
      
      // Calculate time until midnight 
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

    // Listen for terminal dismiss
    const handleTerminalDismiss = () => {
      setShowAnalysis(false);
      setTimeout(() => {
        setTerminalLines([]);
        setAnalysisComplete(false);
      }, 300);
    };

    window.addEventListener('dashboard:terminal-update', handleTerminalUpdate);
    window.addEventListener('dashboard:analysis-start', handleAnalysisStart);
    window.addEventListener('dashboard:analysis-complete', handleAnalysisComplete);
    window.addEventListener('dashboard:limit-reached', handleLimitReached);
    window.addEventListener('terminal:dismiss', handleTerminalDismiss);

    return () => {
      window.removeEventListener('dashboard:terminal-update', handleTerminalUpdate);
      window.removeEventListener('dashboard:analysis-start', handleAnalysisStart);
      window.removeEventListener('dashboard:analysis-complete', handleAnalysisComplete);
      window.removeEventListener('dashboard:limit-reached', handleLimitReached);
      window.removeEventListener('terminal:dismiss', handleTerminalDismiss);
    };
  }, []);

  return { 
    showAnalysis, 
    terminalLines, 
    analysisComplete, 
    limitReached, 
    countdownTime
  };
};

export default useTerminalAnalysis;

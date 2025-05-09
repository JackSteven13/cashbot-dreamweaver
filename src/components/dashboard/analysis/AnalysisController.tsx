
import React, { useState, useEffect } from 'react';
import TerminalOverlay from '../terminal/TerminalOverlay';
import useTerminalAnalysis from '@/hooks/useTerminalAnalysis';
import { toast } from '@/components/ui/use-toast';
import { triggerDashboardEvent } from '@/utils/animations';

const AnalysisController: React.FC = () => {
  const { 
    showAnalysis, 
    terminalLines, 
    analysisComplete, 
    limitReached, 
    countdownTime 
  } = useTerminalAnalysis();
  
  // État local pour le mode d'arrière-plan
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  
  // Effet pour montrer un toast quand l'analyse est terminée
  useEffect(() => {
    if (analysisComplete && !isBackgroundMode) {
      toast({
        title: limitReached 
          ? "Limite atteinte" 
          : "Analyse terminée",
        description: limitReached
          ? "Vous avez atteint votre limite quotidienne d'analyses."
          : "L'analyse des publicités est terminée.",
        duration: 5000,
      });
      
      // Déclencher UNIQUEMENT l'ajout d'UNE SEULE vidéo dans le feed
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('location:added', { 
          detail: { single: true } // Indiquer que c'est un ajout unitaire
        }));
        
        // Déclencher également une mise à jour de solde
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: { timestamp: Date.now(), animate: true }
        }));
      }, 1500);
    }
  }, [analysisComplete, limitReached, isBackgroundMode]);
  
  // Gérer le mode arrière-plan
  useEffect(() => {
    const handleBackgroundModeChange = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.background === 'boolean') {
        setIsBackgroundMode(event.detail.background);
      }
    };
    
    // Abonnement aux événements
    window.addEventListener('dashboard:analysis-start', handleBackgroundModeChange as EventListener);
    
    return () => {
      window.removeEventListener('dashboard:analysis-start', handleBackgroundModeChange as EventListener);
    };
  }, []);
  
  // Ne rien afficher si pas d'analyse en cours
  if (!showAnalysis) {
    return null;
  }
  
  // Fix: Ensure terminalLines is properly formatted as an array of objects with text and type
  const formattedLines = Array.isArray(terminalLines) 
    ? terminalLines.map(line => (typeof line === 'string' ? { text: line, type: 'info' } : line))
    : [];
  
  return (
    <TerminalOverlay 
      lines={formattedLines}
      isComplete={analysisComplete}
      isLimitReached={limitReached}
      isDismissable={analysisComplete}
      countdownTime={countdownTime}
      isBackgroundMode={isBackgroundMode}
    />
  );
};

export default AnalysisController;

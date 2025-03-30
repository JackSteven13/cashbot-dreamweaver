
import { useState, useEffect } from 'react';

export const useTerminalAnalysis = () => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  
  const analysisSteps = [
    "Initialisation de l'analyse vidéo...",
    "Connexion aux serveurs publicitaires...",
    "Identification des annonceurs premium...",
    "Analyse du taux de conversion...",
    "Optimisation des métriques d'engagement...",
    "Calcul des revenus générés...",
    "Mise à jour du solde utilisateur...",
    "Transaction complétée avec succès!"
  ];
  
  // Handle terminal animation
  useEffect(() => {
    if (showAnalysis && analysisStep < analysisSteps.length) {
      const timer = setTimeout(() => {
        setTerminalLines(prev => [...prev, analysisSteps[analysisStep]]);
        setAnalysisStep(prev => prev + 1);
        
        // Mark analysis as complete when all steps are done
        if (analysisStep === analysisSteps.length - 1) {
          setAnalysisComplete(true);
          setTimeout(() => {
            setShowAnalysis(false);
            setAnalysisStep(0);
            setAnalysisComplete(false);
            setTerminalLines([]);
          }, 3000);
        }
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [showAnalysis, analysisStep]);

  // Start terminal animation when a session is started
  useEffect(() => {
    const handleSessionStart = () => {
      setShowAnalysis(true);
    };
    
    window.addEventListener('session:start', handleSessionStart);
    return () => window.removeEventListener('session:start', handleSessionStart);
  }, []);
  
  return {
    showAnalysis,
    analysisStep,
    analysisComplete,
    terminalLines,
    analysisSteps,
    setShowAnalysis
  };
};

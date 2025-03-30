
import React, { useState, useEffect, useRef } from 'react';
import { SystemInfoGrid } from './SystemInfo';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { FeedbackManager } from './FeedbackManager';
import { ProTrialManager } from './ProTrialManager';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { useProTrial } from '@/hooks/useProTrial';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';
import { Terminal, Bot, Sparkles, Cpu } from 'lucide-react';

interface SystemTerminalProps {
  isNewUser: boolean;
  dailyLimit: number;
  subscription: string;
  remainingSessions: number | string;
  referralCount: number;
  displayBalance: number;
  referralBonus?: number;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser,
  dailyLimit,
  subscription,
  remainingSessions,
  referralCount,
  displayBalance,
  referralBonus = 0
}) => {
  const [showProTrialInfo, setShowProTrialInfo] = useState(isNewUser);
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  
  const terminalRef = useRef<HTMLDivElement>(null);
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
  
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  const { isPromoActivated, tempProEnabled, activateProTrial } = useProTrial(subscription);
  
  const limitPercentage = Math.min(100, (displayBalance / effectiveLimit) * 100);
  
  // Update effective subscription and limit when props change
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);
    
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
  }, [subscription]);

  // Handle terminal animation
  useEffect(() => {
    if (showAnalysis && analysisStep < analysisSteps.length) {
      const timer = setTimeout(() => {
        setTerminalLines(prev => [...prev, analysisSteps[analysisStep]]);
        setAnalysisStep(prev => prev + 1);
        
        // Scroll to bottom of terminal
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
        
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

  const handleActivateProTrial = () => {
    activateProTrial(subscription);
  };

  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-gradient-to-br from-[#1A1F2C] to-[#1e3a5f] rounded-xl shadow-lg border border-[#2d5f8a]/30 p-5 text-white">
        <FeedbackManager isNewUser={isNewUser} />
        
        <SystemProgressBar 
          displayBalance={displayBalance} 
          dailyLimit={effectiveLimit} 
          limitPercentage={limitPercentage}
          subscription={subscription}
        />
        
        {isCountingDown && (
          <SessionCountdown timeRemaining={timeRemaining} />
        )}
        
        {/* Terminal output with animations */}
        {showAnalysis && (
          <div 
            ref={terminalRef}
            className="bg-black/70 p-3 rounded-md my-4 h-48 overflow-y-auto font-mono text-sm scrollbar-thin scrollbar-thumb-[#9b87f5] scrollbar-track-transparent"
          >
            <div className="flex items-center mb-2">
              <Terminal size={14} className="mr-2 text-[#9b87f5]" />
              <span className="text-[#9b87f5] font-bold">Stream Genius Terminal</span>
            </div>
            
            {terminalLines.map((line, index) => (
              <div 
                key={index} 
                className={`mb-1 ${index === terminalLines.length - 1 ? 'terminal-text' : ''}`}
              >
                <span className="text-green-500">$</span> 
                <span className={index === terminalLines.length - 2 ? 'text-yellow-300' : 'text-white'}>
                  {line}
                </span>
                
                {index === terminalLines.length - 1 && line.includes("succès") && (
                  <span className="ml-2 text-green-400">✓</span>
                )}
                
                {/* Animation for the last step - funds added */}
                {analysisComplete && index === terminalLines.length - 1 && (
                  <div className="mt-2 text-green-300 font-bold animate-pulse">
                    <span className="inline-block mr-2">
                      <Sparkles size={14} className="inline mr-1" />
                      Fonds ajoutés:
                    </span>
                    <span className="balance-increase inline-block">+{(Math.random() * 0.5 + 0.1).toFixed(2)}€</span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Blinking cursor effect */}
            {!analysisComplete && (
              <span className="blink-cursor"></span>
            )}
          </div>
        )}
        
        {!showAnalysis && (
          <>
            <SystemInfoGrid 
              subscription={subscription}
              tempProEnabled={tempProEnabled}
              dailyLimit={effectiveLimit}
              remainingSessions={remainingSessions}
              referralBonus={referralBonus}
            />
            
            {isNewUser && <NewUserGuide />}
            
            <ProTrialManager 
              subscription={subscription}
              isPromoActivated={isPromoActivated}
              activateProTrial={handleActivateProTrial}
            />
          </>
        )}
        
        {/* System indicators */}
        <div className="flex items-center justify-between mt-4 text-xs text-white/60">
          <div className="flex items-center">
            <Bot size={12} className="mr-1 text-[#9b87f5]" />
            <span>Bots actifs: {Math.floor(Math.random() * 5) + 3}</span>
          </div>
          <div className="flex items-center">
            <Cpu size={12} className="mr-1 text-[#9b87f5]" />
            <span>Système: {showAnalysis ? (
              <span className="text-green-400">Analyse en cours</span>
            ) : (
              <span>En attente</span>
            )}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTerminal;

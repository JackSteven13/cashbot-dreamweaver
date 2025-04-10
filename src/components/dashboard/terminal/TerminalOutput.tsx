
import React, { useEffect, useRef } from 'react';
import { formatTimestamp } from '@/utils/timeUtils';
import Guide from './Guide';
import NewUserGuide from './NewUserGuide';
import SystemIndicators from './SystemIndicators';

interface TerminalOutputProps {
  isNewUser?: boolean;
  subscription?: string;
  referralCount?: number;
  remainingSessions?: number; // Changed from string to number
  dailyLimit: number; // Changed from string to number
  displayBalance: number;
  referralBonus?: number;
  scrollToBottom?: boolean;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({
  isNewUser = false,
  subscription = 'freemium',
  referralCount = 0,
  remainingSessions = 0,
  dailyLimit = 0.5,
  displayBalance = 0,
  referralBonus = 0,
  scrollToBottom = false,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToBottom && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [scrollToBottom]);

  const lastTimestamp = lastSessionTimestamp ? formatTimestamp(lastSessionTimestamp) : 'N/A';

  return (
    <div ref={terminalRef} className="terminal-output space-y-1">
      <p>$ Initialisation du système de génération...</p>
      <p>$ Chargement des modules d'analyse: <span className="text-cyan-500">OK</span></p>
      <p>$ Connexion à la base de données: <span className="text-cyan-500">OK</span></p>
      <p>$ Synchronisation des paramètres utilisateur: <span className="text-cyan-500">OK</span></p>
      
      <SystemIndicators isBotActive={isBotActive} />
      
      <p>$ Configuration actuelle:</p>
      <p>  - Forfait: <span className="text-yellow-400">{subscription.toUpperCase()}</span></p>
      <p>  - Limite journalière: <span className="text-yellow-400">{dailyLimit}€</span></p>
      <p>  - Balance actuelle: <span className="text-green-400">{displayBalance.toFixed(2)}€</span></p>
      
      {referralCount > 0 && (
        <p>  - Bonus parrainage: <span className="text-purple-400">{referralBonus.toFixed(2)}€</span></p>
      )}
      
      {lastSessionTimestamp && (
        <p>  - Dernière session: <span className="text-blue-400">{lastTimestamp}</span></p>
      )}
      
      <p>$ Status: <span className="text-cyan-500">Prêt</span></p>
      
      {isNewUser ? (
        <NewUserGuide />
      ) : (
        <Guide 
          subscription={subscription}
          remainingSessions={remainingSessions}
          referralCount={referralCount}
        />
      )}
    </div>
  );
};

export default TerminalOutput;

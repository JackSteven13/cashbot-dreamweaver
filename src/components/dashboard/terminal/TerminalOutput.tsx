
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatTimestamp } from '@/utils/formatters';
import { Guide } from './Guide';

interface TerminalOutputProps {
  isNewUser?: boolean;
  subscription?: string;
  remainingSessions?: number;
  referralCount?: number;
  dailyLimit?: number;
  displayBalance?: number;
  referralBonus?: number;
  scrollToBottom?: boolean;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({
  isNewUser = false,
  subscription = 'freemium',
  remainingSessions = 0,
  referralCount = 0,
  dailyLimit = 0.5,
  displayBalance = 0,
  referralBonus = 0,
  scrollToBottom = false,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[]>([
    '> System initialized...',
    '> Loading user data...',
    '> Security verification complete.',
    `> Current subscription: ${subscription.toUpperCase()}`,
    `> Daily revenue limit: ${dailyLimit.toFixed(2)}€`,
  ]);
  
  // Effet pour ajouter des lignes supplémentaires en fonction des paramètres
  useEffect(() => {
    const newLines = [...lines];
    
    // Vérifier si certaines lignes existent déjà pour éviter les doublons
    const hasReferralLine = lines.some(line => line.includes('referrals detected'));
    const hasBalanceLine = lines.some(line => line.includes('Current balance:'));
    const hasSessionLine = lines.some(line => line.includes('sessions available'));
    const hasBotStatusLine = lines.some(line => line.includes('Bot status:'));
    
    if (!hasReferralLine && referralCount > 0) {
      newLines.push(`> ${referralCount} active referrals detected (+${referralBonus.toFixed(2)}% bonus)`);
    }
    
    if (!hasBalanceLine) {
      newLines.push(`> Current balance: ${displayBalance.toFixed(2)}€`);
    }
    
    if (!hasSessionLine) {
      const sessionText = subscription === 'freemium' 
        ? `${remainingSessions} manual sessions available today`
        : 'Unlimited sessions available';
      newLines.push(`> ${sessionText}`);
    }
    
    if (!hasBotStatusLine) {
      newLines.push(`> Bot status: ${isBotActive ? 'ACTIVE' : 'INACTIVE'}`);
    }
    
    // Ajouter une ligne pour la dernière session si disponible
    if (lastSessionTimestamp) {
      const timestamp = formatTimestamp(lastSessionTimestamp);
      const hasLastSessionLine = lines.some(line => line.includes('Last session:'));
      
      if (!hasLastSessionLine) {
        newLines.push(`> Last session: ${timestamp}`);
      }
    }
    
    // Ajouter un message si l'utilisateur est nouveau
    if (isNewUser && !lines.some(line => line.includes('Welcome new user'))) {
      newLines.push('');
      newLines.push('> Welcome new user! Please start with the guide below.');
    }
    
    // Mettre à jour les lignes seulement si elles ont changé
    if (newLines.length !== lines.length) {
      setLines(newLines);
    }
  }, [subscription, remainingSessions, referralCount, displayBalance, 
      referralBonus, isNewUser, lastSessionTimestamp, isBotActive, lines]);
  
  // Effet pour ajouter des lignes lors d'événements spécifiques
  useEffect(() => {
    const handleTerminalUpdate = (event: CustomEvent) => {
      const lineDetail = event.detail?.line || "Command executed";
      
      setLines(prev => [...prev, `> ${lineDetail}`]);
    };
    
    const handleSessionStart = () => {
      setLines(prev => [...prev, '', '> Starting manual session...', '> Processing data...']);
    };
    
    const handleAnalysisComplete = (event: CustomEvent) => {
      const gain = event.detail?.gain || 0;
      
      setLines(prev => [
        ...prev, 
        `> Analysis complete: +${gain.toFixed(2)}€ added to your balance`, 
        `> New balance: ${(displayBalance + gain).toFixed(2)}€`
      ]);
    };
    
    window.addEventListener('terminal:update', handleTerminalUpdate as EventListener);
    window.addEventListener('session:start', handleSessionStart);
    window.addEventListener('analysis:complete', handleAnalysisComplete as EventListener);
    
    return () => {
      window.removeEventListener('terminal:update', handleTerminalUpdate as EventListener);
      window.removeEventListener('session:start', handleSessionStart);
      window.removeEventListener('analysis:complete', handleAnalysisComplete as EventListener);
    };
  }, [displayBalance]);
  
  // Scroll vers le bas du terminal quand de nouvelles lignes sont ajoutées
  useEffect(() => {
    if (scrollToBottom && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, scrollToBottom]);
  
  return (
    <div className="space-y-4">
      <div ref={terminalRef} className="space-y-1">
        {lines.map((line, index) => (
          <div 
            key={index} 
            className={cn(
              "terminal-line", 
              line.includes('ERROR') && "text-red-500",
              line.includes('+') && line.includes('€') && "text-blue-400"
            )}
          >
            {line}
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <Guide isNewUser={isNewUser} />
      </div>
    </div>
  );
};

export default TerminalOutput;

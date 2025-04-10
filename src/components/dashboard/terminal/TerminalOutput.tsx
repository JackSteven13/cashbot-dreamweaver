
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
  const [cumulativeEarnings, setCumulativeEarnings] = useState<number>(0);
  const [daysActive, setDaysActive] = useState<number>(0);
  
  // Récupérer les statistiques cumulées au montage du composant
  useEffect(() => {
    try {
      // Récupérer les jours consécutifs d'activité
      const consecutiveDays = localStorage.getItem('consecutiveDays');
      if (consecutiveDays) {
        const days = parseInt(consecutiveDays, 10);
        if (!isNaN(days)) {
          setDaysActive(days);
        }
      }
      
      // Récupérer les gains cumulés (en utilisant highestBalance pour fiabilité)
      const highestBalance = localStorage.getItem('highestBalance');
      if (highestBalance) {
        const balance = parseFloat(highestBalance);
        if (!isNaN(balance)) {
          setCumulativeEarnings(balance);
        } else {
          setCumulativeEarnings(displayBalance);
        }
      } else {
        setCumulativeEarnings(displayBalance);
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des statistiques:", e);
      setCumulativeEarnings(displayBalance);
    }
  }, [displayBalance]);
  
  // Effet pour ajouter des lignes supplémentaires en fonction des paramètres
  useEffect(() => {
    const newLines = [...lines];
    
    // Vérifier si certaines lignes existent déjà pour éviter les doublons
    const hasReferralLine = lines.some(line => line.includes('referrals detected'));
    const hasBalanceLine = lines.some(line => line.includes('Current balance:'));
    const hasSessionLine = lines.some(line => line.includes('sessions available'));
    const hasBotStatusLine = lines.some(line => line.includes('Bot status:'));
    const hasCumulativeEarningsLine = lines.some(line => line.includes('Total accumulated earnings:'));
    const hasDaysActiveLine = lines.some(line => line.includes('Days of continuous activity:'));
    
    // Supprimer les anciennes lignes avec des informations obsolètes
    const filteredLines = newLines.filter(line => 
      !line.includes('Current balance:') && 
      !line.includes('sessions available') &&
      !line.includes('Bot status:')
    );
    
    // Ajouter les lignes mises à jour
    if (referralCount > 0 && !hasReferralLine) {
      filteredLines.push(`> ${referralCount} active referrals detected (+${referralBonus.toFixed(2)}% bonus)`);
    }
    
    // Ajouter le solde actuel (toujours mis à jour)
    filteredLines.push(`> Current balance: ${displayBalance.toFixed(2)}€`);
    
    // Ajouter les sessions disponibles (toujours mises à jour)
    const sessionText = subscription === 'freemium' 
      ? `${remainingSessions} manual sessions available today`
      : 'Unlimited sessions available';
    filteredLines.push(`> ${sessionText}`);
    
    // Ajouter le statut du bot (toujours mis à jour)
    filteredLines.push(`> Bot status: ${isBotActive ? 'ACTIVE' : 'INACTIVE'}`);
    
    // Ajouter des lignes pour montrer l'accumulation progressive
    if (!hasCumulativeEarningsLine && cumulativeEarnings > 0 && !isNewUser) {
      filteredLines.push('');
      filteredLines.push(`> Total accumulated earnings: ${cumulativeEarnings.toFixed(2)}€`);
    }
    
    if (!hasDaysActiveLine && daysActive > 0 && !isNewUser) {
      filteredLines.push(`> Days of continuous activity: ${daysActive}`);
      
      // Ajouter un message motivant selon le nombre de jours
      if (daysActive >= 30) {
        filteredLines.push("> MILESTONE ACHIEVED: 30+ days of consistent earnings!");
      } else if (daysActive >= 15) {
        filteredLines.push("> IMPRESSIVE: Your consistency is building financial momentum!");
      } else if (daysActive >= 7) {
        filteredLines.push("> WELL DONE: A full week of continuous earnings growth!");
      } else if (daysActive >= 3) {
        filteredLines.push("> GOOD START: Keep going to maximize your earnings potential!");
      }
    }
    
    // Ajouter une ligne pour la dernière session si disponible
    if (lastSessionTimestamp) {
      const timestamp = formatTimestamp(lastSessionTimestamp);
      const hasLastSessionLine = filteredLines.some(line => line.includes('Last session:'));
      
      if (!hasLastSessionLine) {
        filteredLines.push(`> Last session: ${timestamp}`);
      }
    }
    
    // Ajouter un message si l'utilisateur est vraiment nouveau (vérification stricte)
    if (isNewUser && !filteredLines.some(line => line.includes('Welcome new user'))) {
      // Vérifier s'il s'agit vraiment d'un nouvel utilisateur en vérifiant le localStorage
      const welcomeShown = localStorage.getItem('welcomeMessageShown') === 'true';
      
      // Ne montrer le message que pour les utilisateurs qui n'ont jamais vu le message de bienvenue
      if (!welcomeShown) {
        filteredLines.push('');
        filteredLines.push('> Welcome new user! Please start with the guide below.');
        filteredLines.push('> Your journey to financial freedom begins here.');
      }
    }
    
    // Mettre à jour les lignes seulement si elles ont changé
    if (JSON.stringify(filteredLines) !== JSON.stringify(lines)) {
      setLines(filteredLines);
    }
  }, [subscription, remainingSessions, referralCount, displayBalance, 
      referralBonus, isNewUser, lastSessionTimestamp, isBotActive, 
      cumulativeEarnings, daysActive]);
  
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
      
      // Mettre à jour les gains cumulés
      setCumulativeEarnings(prev => {
        const newTotal = prev + gain;
        return newTotal;
      });
      
      setLines(prev => [
        ...prev, 
        `> Analysis complete: +${gain.toFixed(2)}€ added to your balance`, 
        `> New balance: ${(displayBalance + gain).toFixed(2)}€`
      ]);
      
      // Déclencher un événement pour mettre à jour les jours consécutifs si nécessaire
      window.dispatchEvent(new CustomEvent('revenue:generated', { 
        detail: { amount: gain } 
      }));
    };
    
    window.addEventListener('terminal:update', handleTerminalUpdate as EventListener);
    window.addEventListener('session:start', handleSessionStart);
    window.addEventListener('analysis:complete', handleAnalysisComplete as EventListener);
    
    return () => {
      window.removeEventListener('terminal:update', handleTerminalUpdate as EventListener);
      window.removeEventListener('session:start', handleSessionStart);
      window.removeEventListener('analysis:complete', handleAnalysisComplete as EventListener);
    };
  }, [displayBalance, cumulativeEarnings]);
  
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
              line.includes('+') && line.includes('€') && "text-blue-400",
              line.includes('MILESTONE') && "text-yellow-300 font-bold",
              line.includes('IMPRESSIVE') && "text-green-300 font-bold",
              line.includes('WELL DONE') && "text-cyan-300 font-bold",
              line.includes('GOOD START') && "text-blue-300 font-bold",
              line.includes('Total accumulated') && "text-emerald-300",
              line.includes('financial freedom') && "text-yellow-200 italic"
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

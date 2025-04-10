
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Bot, BotOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import TerminalOutput from './TerminalOutput';

interface SystemTerminalProps {
  isNewUser?: boolean;
  dailyLimit?: number;
  subscription?: string;
  remainingSessions?: number;
  referralCount?: number;
  displayBalance?: number;
  referralBonus?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser = false,
  dailyLimit = 0.5,
  subscription = 'freemium',
  remainingSessions = 0,
  referralCount = 0,
  displayBalance = 0,
  referralBonus = 0,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // State pour gérer l'état visuel du terminal
  const [animationActive, setAnimationActive] = useState(false);
  const [scrollToBottom, setScrollToBottom] = useState(false);
  
  // Animer le terminal en réponse aux événements
  useEffect(() => {
    const handleTerminalUpdate = () => {
      setAnimationActive(true);
      setTimeout(() => {
        setAnimationActive(false);
      }, 1500);
      setScrollToBottom(true);
    };
    
    window.addEventListener('terminal:update', handleTerminalUpdate);
    window.addEventListener('session:start', handleTerminalUpdate);
    
    return () => {
      window.removeEventListener('terminal:update', handleTerminalUpdate);
      window.removeEventListener('session:start', handleTerminalUpdate);
    };
  }, []);
  
  // Retourne false si le temps écoulé est < 12h
  const shouldShowTimestamp = (lastTimestamp?: string): boolean => {
    if (!lastTimestamp) return false;
    
    try {
      const timestamp = new Date(lastTimestamp);
      const now = new Date();
      const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      return diffHours <= 12;
    } catch (error) {
      console.error("Error parsing timestamp:", error);
      return false;
    }
  };
  
  return (
    <Card className={cn(
      "min-h-[400px] shadow-md border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200",
      animationActive && "border-blue-400 dark:border-blue-500"
    )}>
      <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-2">
            {isBotActive ? (
              <Bot className="h-5 w-5 text-blue-500" />
            ) : (
              <BotOff className="h-5 w-5 text-red-500" />
            )}
          </div>
          <h2 className="font-medium text-slate-800 dark:text-slate-200">
            Système {isBotActive ? 'Actif' : 'Inactif'}
          </h2>
        </div>
        <div className="flex space-x-1">
          {Array(3).fill(0).map((_, i) => (
            <div 
              key={i}
              className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"
            />
          ))}
        </div>
      </div>
      
      <div className="bg-black text-green-500 font-mono text-xs p-4 h-[350px] overflow-auto">
        <TerminalOutput 
          isNewUser={isNewUser}
          subscription={subscription}
          remainingSessions={remainingSessions}
          referralCount={referralCount}
          dailyLimit={dailyLimit}
          displayBalance={displayBalance}
          referralBonus={referralBonus}
          scrollToBottom={scrollToBottom}
          lastSessionTimestamp={
            shouldShowTimestamp(lastSessionTimestamp) ? 
            lastSessionTimestamp : undefined
          }
          isBotActive={isBotActive}
        />
      </div>
    </Card>
  );
};

export default SystemTerminal;

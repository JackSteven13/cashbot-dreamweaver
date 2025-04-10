
import React, { useEffect, useRef } from 'react';
import { SystemInfo } from './SystemInfo';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';

interface TerminalOutputProps {
  isNewUser?: boolean;
  subscription?: string;
  remainingSessions?: number;
  referralCount?: number;
  dailyLimit: number; // Explicitly typed as number
  displayBalance: number; // Explicitly typed as number
  referralBonus: number; // Explicitly typed as number
  lastSessionTimestamp?: string;
  scrollToBottom?: boolean;
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
  lastSessionTimestamp,
  scrollToBottom = false,
  isBotActive = true
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Use the countdown hook to get countdown time
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    remainingSessions,
    subscription,
    lastSessionTimestamp
  );

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (scrollToBottom && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [scrollToBottom]);

  // Format the balance for display
  const formattedBalance = displayBalance.toFixed(2);
  const formattedDailyLimit = dailyLimit.toFixed(2);
  
  // Calculate percentage for progress bar
  const limitPercentage = Math.min(100, (displayBalance / dailyLimit) * 100);

  return (
    <div ref={terminalRef} className="space-y-2">
      <SystemInfo 
        isNewUser={isNewUser}
        subscription={subscription}
      />
      
      <div className="text-green-400">
        $ system.checkAccountStatus()
      </div>
      
      <div className="pl-4">
        {isNewUser ? (
          <NewUserGuide />
        ) : (
          <>
            <div className="text-gray-400">
              {'>'} Compte actif: <span className="text-green-400">Oui</span>
            </div>
            <div className="text-gray-400">
              {'>'} Plan: <span className="text-blue-400">{subscription}</span>
            </div>
            <div className="text-gray-400">
              {'>'} Solde actuel: <span className="text-yellow-400">{formattedBalance}€</span>
            </div>
            {referralCount > 0 && (
              <div className="text-gray-400">
                {'>'} Parrainages actifs: <span className="text-purple-400">{referralCount}</span>
              </div>
            )}
            {referralBonus > 0 && (
              <div className="text-gray-400">
                {'>'} Bonus de parrainage: <span className="text-purple-400">{referralBonus.toFixed(2)}€</span>
              </div>
            )}
            <div className="text-gray-400">
              {'>'} Limite journalière: <span className="text-red-400">{formattedDailyLimit}€</span>
            </div>
            {typeof remainingSessions === 'number' ? (
              <div className="text-gray-400">
                {'>'} Sessions restantes: <span className="text-cyan-400">
                  {subscription !== 'freemium' ? 'illimitées' : remainingSessions}
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>
      
      <div className="text-green-400">
        $ system.getActivity()
      </div>
      
      <div className="pl-4">
        <div className="text-gray-400">
          {'>'} Bot: <span className={isBotActive ? "text-green-400" : "text-red-400"}>
            {isBotActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
        
        {lastSessionTimestamp && (
          <div className="text-gray-400">
            {'>'} Dernière analyse: <span className="text-blue-400">
              {new Date(lastSessionTimestamp).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
        
        {isBotActive && (
          <div className="mt-1">
            <SystemProgressBar 
              displayBalance={displayBalance}
              dailyLimit={dailyLimit}
              limitPercentage={limitPercentage}
              subscription={subscription}
              botActive={isBotActive}
            />
          </div>
        )}
      </div>
      
      {!isNewUser && subscription === 'freemium' && remainingSessions === 0 && (
        <>
          <div className="text-amber-400">
            $ system.showCountdown()
          </div>
          <div className="pl-4">
            <SessionCountdown timeRemaining={timeRemaining} />
          </div>
        </>
      )}
    </div>
  );
};

export default TerminalOutput;

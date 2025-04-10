
import React, { useEffect, useRef } from 'react';
import { calculateLimitPercentage } from '@/utils/balance/limitCalculations';

interface TerminalOutputProps {
  isNewUser?: boolean;
  subscription?: string;
  remainingSessions?: number;
  referralCount?: number;
  dailyLimit: number;
  displayBalance: number;
  referralBonus: number;
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
  
  // Défiler jusqu'au bas lorsque le contenu change
  useEffect(() => {
    if (scrollToBottom && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [scrollToBottom, isNewUser, displayBalance, isBotActive]);
  
  // Calculer le pourcentage de la limite journalière
  const limitPercentage = calculateLimitPercentage(displayBalance, dailyLimit);
  const isLimitReached = limitPercentage >= 100;

  return (
    <div ref={terminalRef} className="terminal-output space-y-3">
      {/* Affichage style console comme sur l'image */}
      <div>
        <div className="text-green-400">$ system.bootSequence()</div>
        <div className="pl-4">
          <div><span className="text-green-400">&gt; Initialisation...</span> <span className="text-green-500">OK</span></div>
          <div><span className="text-green-400">&gt; Vérification système...</span> <span className="text-green-500">OK</span></div>
          <div><span className="text-green-400">&gt; Chargement algorithmes...</span> <span className="text-green-500">OK</span></div>
          <div><span className="text-green-400">&gt; Compte:</span> Vérifié</div>
          <div><span className="text-green-400">&gt; Plan:</span> {subscription}</div>
          <div><span className="text-green-400">&gt; Système prêt</span></div>
        </div>
      </div>

      <div>
        <div className="text-green-400">$ system.checkAccountStatus()</div>
        <div className="pl-4">
          <div><span className="text-green-400">&gt; Compte actif:</span> Oui</div>
          <div><span className="text-green-400">&gt; Plan:</span> {subscription}</div>
          <div><span className="text-green-400">&gt; Solde actuel:</span> {displayBalance.toFixed(2)}€</div>
          <div><span className="text-green-400">&gt; Limite journalière:</span> {dailyLimit.toFixed(2)}€</div>
          <div><span className="text-green-400">&gt; Sessions restantes:</span> {remainingSessions}</div>
        </div>
      </div>

      <div>
        <div className="text-green-400">$ system.getActivity()</div>
        <div className="pl-4">
          <div><span className="text-green-400">&gt; Bot:</span> {isBotActive ? 'Actif' : 'Inactif'}</div>
        </div>
      </div>
      
      {isLimitReached && (
        <div>
          <div className="text-green-400">$ system.showCountdown()</div>
          <div className="pl-4">
            <div><span className="text-green-400">&gt; Prochaine réinitialisation:</span> 00:00:00</div>
          </div>
        </div>
      )}
      
      {/* Cursor clignotant */}
      <div className="flex items-center">
        <span className="text-green-400">$</span>
        <span className="ml-1 w-2 h-4 bg-green-500 animate-pulse"></span>
      </div>
    </div>
  );
};

export default TerminalOutput;

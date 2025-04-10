
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
  
  // Formater les valeurs numériques pour l'affichage
  const formatValue = (value: number): string => {
    return `${value.toFixed(2)}€`;
  };

  // Styles de couleur cohérents - utiliser une palette cyan uniforme
  const primaryColor = "text-cyan-400"; // Couleur principale pour les commandes
  const successColor = "text-cyan-300"; // Couleur pour les statuts OK
  const valueColor = "text-cyan-200"; // Couleur pour les valeurs
  const warningColor = "text-amber-300"; // Couleur pour les avertissements
  const errorColor = "text-red-400"; // Couleur pour les erreurs/inactif

  return (
    <div ref={terminalRef} className="terminal-output space-y-3">
      {/* En-tête du terminal */}
      <div>
        <div className="text-gray-500"># Terminal système v3.42.1</div>
        <div className={primaryColor}>&gt; analyzing_system --status</div>
        <div className="pl-2">
          Status: <span className={isBotActive ? successColor : errorColor}>
            {isBotActive ? "ONLINE" : "OFFLINE"}
          </span>
          {isBotActive ? (
            <span className="text-gray-500 ml-2">// Système en fonctionnement normal</span>
          ) : (
            <span className="text-gray-500 ml-2">// Système en veille - limite atteinte</span>
          )}
        </div>
      </div>
      
      {/* Informations sur l'utilisateur */}
      <div>
        <div className={primaryColor}>&gt; user --info</div>
        <div className="pl-2">
          Subscription: <span className={valueColor}>{subscription}</span><br />
          Daily Limit: <span className={valueColor}>{formatValue(dailyLimit)}</span><br />
          Balance: <span className={valueColor}>{formatValue(displayBalance)}</span><br />
          Bonus Parrainage: <span className={valueColor}>{formatValue(referralBonus)}</span><br />
          {referralCount > 0 && (
            <>Referrals: <span className={valueColor}>{referralCount}</span><br /></>
          )}
        </div>
      </div>
      
      {/* Statut des limites */}
      <div>
        <div className={primaryColor}>&gt; user --limit-status</div>
        <div className="pl-2">
          <div>
            Daily limit usage: <span className={
              isLimitReached ? errorColor : (limitPercentage > 80 ? warningColor : successColor)
            }>
              {Math.floor(limitPercentage)}%
            </span>
          </div>
          <div className="w-64 h-1 bg-gray-700 mt-1 mb-2">
            <div 
              className={`h-full ${isLimitReached ? 'bg-red-500' : (limitPercentage > 80 ? 'bg-amber-400' : 'bg-cyan-400')}`} 
              style={{ width: `${limitPercentage}%` }}
            />
          </div>
          {isLimitReached && (
            <div className={errorColor}>
              ALERTE: Limite journalière atteinte de {formatValue(dailyLimit)}
            </div>
          )}
        </div>
      </div>
      
      {/* Statut de session */}
      <div>
        <div className={primaryColor}>&gt; session --status</div>
        <div className="pl-2">
          {isLimitReached ? (
            <span className={errorColor}>
              Sessions bloquées - limite journalière atteinte
            </span>
          ) : isBotActive ? (
            <span className={successColor}>
              Sessions actives - prêt pour analyse
            </span>
          ) : (
            <span className={errorColor}>
              Sessions inactives - système en veille
            </span>
          )}
          {subscription === 'freemium' && !isLimitReached && (
            <div>
              Sessions manuelles restantes: <span className={valueColor}>{
                Math.max(0, 1 - (remainingSessions || 0))
              }</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Dernière activité */}
      {lastSessionTimestamp && (
        <div>
          <div className={primaryColor}>&gt; session --last-activity</div>
          <div className="pl-2">
            <span className={valueColor}>
              {new Date(lastSessionTimestamp).toLocaleTimeString()} - {
                new Date(lastSessionTimestamp).toLocaleDateString()
              }
            </span>
          </div>
        </div>
      )}
      
      {/* Si l'utilisateur est nouveau, afficher un message de bienvenue */}
      {isNewUser && (
        <div className="mt-4">
          <div className={warningColor}>&gt; system --welcome-message</div>
          <div className="pl-2">
            Bienvenue dans notre système d'analyse publicitaire.<br/>
            Commencez par lancer une session d'analyse pour générer vos premiers revenus.
          </div>
        </div>
      )}
      
      {/* Commandes disponibles */}
      <div className="mt-4">
        <div className={primaryColor}>&gt; help</div>
        <div className="pl-2 text-gray-500">
          Commandes disponibles:<br/>
          - session --start : Démarrer une nouvelle analyse<br/>
          - system --reset : Réinitialiser le système<br/>
          - user --upgrade : Augmenter votre limite journalière
        </div>
      </div>
      
      {/* Si le système est inactif (limite atteinte), afficher un message d'info */}
      {isLimitReached && (
        <div className="mt-2">
          <div className={errorColor}>&gt; system --warning</div>
          <div className="pl-2 text-amber-300">
            Limite journalière atteinte. Pour continuer l'analyse, veuillez:<br/>
            - Attendre le renouvellement quotidien à minuit<br/>
            - Passer à un forfait supérieur pour augmenter votre limite
          </div>
        </div>
      )}
      
      {/* Cursor clignotant */}
      <div className="flex items-center">
        <span className={primaryColor}>&gt;</span>
        <span className="ml-1 w-2 h-4 bg-green-500 animate-pulse"></span>
      </div>
    </div>
  );
};

export default TerminalOutput;

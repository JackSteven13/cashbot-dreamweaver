
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

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
  dailyLimit,
  displayBalance,
  referralBonus,
  scrollToBottom = false,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Défilement automatique vers le bas du terminal
  useEffect(() => {
    if (scrollToBottom && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [scrollToBottom]);

  // Fonction pour formater les valeurs monétaires
  const formatCurrency = (value: number) => {
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
      {/* Séquence de démarrage */}
      <div className="terminal-section">
        <div className={primaryColor}>$ system.bootSequence()</div>
        <div className="ml-4">
          &gt; Initialisation... <span className={successColor}>OK</span>
        </div>
        <div className="ml-4">
          &gt; Vérification système... <span className={successColor}>OK</span>
        </div>
        <div className="ml-4">
          &gt; Chargement algorithmes... <span className={successColor}>OK</span>
        </div>
        <div className="ml-4">
          &gt; Compte: <span className={valueColor}>Vérifié</span>
        </div>
        <div className="ml-4">
          &gt; Plan: <span className={valueColor}>{subscription}</span>
        </div>
        <div className="ml-4">
          &gt; Système prêt
        </div>
      </div>

      {/* Vérification du compte */}
      <div className="terminal-section">
        <div className={primaryColor}>$ system.checkAccountStatus()</div>
        <div className="ml-4">
          &gt; Compte actif: <span className={valueColor}>Oui</span>
        </div>
        <div className="ml-4">
          &gt; Plan: <span className={valueColor}>{subscription}</span>
        </div>
        <div className="ml-4">
          &gt; Solde actuel: <span className={valueColor}>{formatCurrency(displayBalance)}</span>
        </div>
        <div className="ml-4">
          &gt; Limite journalière: <span className={valueColor}>{formatCurrency(dailyLimit)}</span>
        </div>
        <div className="ml-4">
          &gt; Sessions restantes: <span className={remainingSessions === 0 ? warningColor : valueColor}>{remainingSessions}</span>
        </div>
      </div>

      {/* Activité du système */}
      <div className="terminal-section">
        <div className={primaryColor}>$ system.getActivity()</div>
        <div className="ml-4">
          &gt; Bot: <span className={isBotActive ? successColor : errorColor}>{isBotActive ? 'Actif' : 'Inactif'}</span>
        </div>
        {lastSessionTimestamp && (
          <div className="ml-4">
            &gt; Dernière session: <span className={valueColor}>{new Date(lastSessionTimestamp).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Décompte ou message selon l'état */}
      <div className="terminal-section">
        {isBotActive ? (
          <div className={primaryColor}>$ system.showCountdown()</div>
        ) : (
          <div className={errorColor}>$ system.reactivate()</div>
        )}
      </div>
      
      {/* Message pour nouveau compte */}
      {isNewUser && (
        <div className="terminal-section mt-4 border-t border-gray-800 pt-2">
          <div className={warningColor}>
            [INFORMATION] Nouveau compte détecté. Accès aux tutoriels débloqué.
          </div>
        </div>
      )}
      
      {/* Info référence si applicable */}
      {referralCount > 0 && (
        <div className="terminal-section border-t border-gray-800 pt-2">
          <div className={primaryColor}>$ system.referralStatus()</div>
          <div className="ml-4">
            &gt; Affiliés actifs: <span className={valueColor}>{referralCount}</span>
          </div>
          <div className="ml-4">
            &gt; Bonus généré: <span className={valueColor}>{formatCurrency(referralBonus)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalOutput;

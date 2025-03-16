
import React from 'react';

interface SystemTerminalProps {
  isNewUser: boolean;
  dailyLimit: number;
  subscription: string;
  remainingSessions: number | string;
  referralCount: number;
  displayBalance: number;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser,
  dailyLimit,
  subscription,
  remainingSessions,
  referralCount,
  displayBalance
}) => {
  return (
    <div className="w-full lg:w-1/2 cyber-terminal">
      <h3 className="text-lg font-semibold text-[#a0aec0] mb-3">📈 {isNewUser ? "CashBot est actif" : "État du système :"}</h3>
      <div className="font-mono text-sm text-[#e2e8f0] space-y-2">
        {isNewUser ? (
          <>
            <p>{"> Syst��me initialisé..."}</p>
            <p>{"> Technologie propriétaire activée"}</p>
            <p>{"> Processus en cours..."}</p>
            <p>{"> Limite journalière : " + dailyLimit + "€"}</p>
            <p>{subscription === 'freemium' ? "> 1 session manuelle par jour" : "> Sessions manuelles illimitées"}</p>
            <p>{referralCount > 0 ? `> Bonus filleuls : +${Math.min(referralCount * 5, 25)}%` : "> Aucun filleul actif"}</p>
          </>
        ) : (
          <>
            <p>{"> Système en exécution..."}</p>
            <p>{"> Traitement automatique des données"}</p>
            <p>{"> Optimisation du rendement"}</p>
            <p>{"> Potentiel journalier : " + dailyLimit + "€"}</p>
            <p>{subscription === 'freemium' 
              ? `> Sessions restantes : ${remainingSessions}` 
              : "> Sessions illimitées"}</p>
            <p>{referralCount > 0 ? `> Bonus filleuls : +${Math.min(referralCount * 5, 25)}%` : "> Aucun filleul actif"}</p>
            <p>{`> Solde actuel : ${displayBalance.toFixed(2)}€`}</p>
          </>
        )}
        <p className="blink-cursor">&nbsp;</p>
      </div>
      
      <div className="mt-4 bg-[#1a2234] p-3 rounded border border-[#2c3e50]">
        <p className="text-[#a0aec0] text-xs">
          Une session correspond à un boost manuel où CashBot analyse intensivement des publicités pour générer des revenus immédiats. 
          {subscription === 'freemium' 
            ? ' Avec le forfait Freemium, vous êtes limité à 1 session par jour et 0.5€ de gains maximum.' 
            : ' Votre abonnement vous permet de lancer des sessions manuelles illimitées.'}
          {referralCount > 0 && ' Chaque filleul vous apporte un bonus de gains de 5% (jusqu\'à 25% au total).'}
        </p>
      </div>
    </div>
  );
};

export default SystemTerminal;

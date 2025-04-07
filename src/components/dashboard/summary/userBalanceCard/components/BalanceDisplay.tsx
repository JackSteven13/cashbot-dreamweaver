
import React, { useEffect, useRef, useState } from 'react';
import { Bot, BotOff } from 'lucide-react';
import { balanceManager } from '@/utils/balance/balanceManager';
import { animateBalanceUpdate } from '@/utils/animations/animateBalanceUpdate';

interface BalanceDisplayProps {
  displayBalance: number;
  balanceAnimating: boolean;
  animatedBalance: number;
  previousBalance: number;
  referralBonus?: number;
  totalGeneratedBalance?: number;
  isBotActive?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  displayBalance,
  balanceAnimating,
  animatedBalance,
  previousBalance,
  referralBonus = 0,
  totalGeneratedBalance = 0,
  isBotActive = true
}) => {
  // S'assurer d'avoir des nombres valides pour l'affichage
  const safeReferralBonus = referralBonus ?? 0;
  const safeTotalGeneratedBalance = totalGeneratedBalance ?? (displayBalance * 1.2);
  
  // Gestion de l'état local du solde pour les animations
  const [localDisplayBalance, setLocalDisplayBalance] = useState(displayBalance);
  const [localBotActive, setLocalBotActive] = useState(isBotActive);
  
  // Ref pour la fonction d'animation et la valeur initiale
  const balanceRef = useRef<HTMLDivElement>(null);
  const initialBalanceValue = useRef(displayBalance);
  const minimumDisplayBalance = useRef(displayBalance);
  
  // Au montage, synchroniser avec le gestionnaire de solde
  useEffect(() => {
    // Initialiser les références avec la valeur de départ
    initialBalanceValue.current = displayBalance;
    minimumDisplayBalance.current = displayBalance;
    
    // S'abonner aux mises à jour du gestionnaire de solde
    const unsubscribe = balanceManager.subscribe((state) => {
      // Ne mettre à jour que si le solde est différent
      if (state.lastKnownBalance !== localDisplayBalance) {
        // PROTECTION CRITIQUE: Ne jamais descendre en dessous de la valeur minimale connue
        const newBalance = Math.max(
          state.lastKnownBalance, 
          minimumDisplayBalance.current
        );
        
        // Animer doucement vers la nouvelle valeur
        animateBalanceUpdate(
          localDisplayBalance, 
          newBalance, 
          800, 
          (value) => setLocalDisplayBalance(value)
        );
      }
    });
    
    // Initialiser le gestionnaire avec la valeur initiale
    if (displayBalance > 0) {
      balanceManager.initialize(displayBalance);
    }
    
    return () => {
      unsubscribe(); // Se désabonner à la destruction du composant
    };
  }, []);
  
  // N'accepter les mises à jour de props displayBalance que si différentes
  useEffect(() => {
    if (displayBalance !== localDisplayBalance) {
      // Mettre à jour la valeur minimale si nécessaire
      minimumDisplayBalance.current = Math.max(minimumDisplayBalance.current, localDisplayBalance);
      
      // Ne jamais descendre en dessous de la valeur minimale pour éviter le flash à 0
      const targetBalance = Math.max(displayBalance, minimumDisplayBalance.current);
      
      animateBalanceUpdate(
        localDisplayBalance, 
        targetBalance, 
        800, 
        (value) => setLocalDisplayBalance(value)
      );
    }
  }, [displayBalance]);
  
  // Écouteur d'événement pour la session:start qui protège contre les réinitialisations
  useEffect(() => {
    const handleSessionStart = () => {
      // Protéger la valeur actuelle pour éviter toute régression visuelle
      minimumDisplayBalance.current = Math.max(minimumDisplayBalance.current, localDisplayBalance);
      console.log("Protected minimum balance value:", minimumDisplayBalance.current);
    };
    
    window.addEventListener('session:start', handleSessionStart);
    return () => window.removeEventListener('session:start', handleSessionStart);
  }, [localDisplayBalance]);
  
  // Écouter les événements de changement d'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setLocalBotActive(isActive);
      }
    };
    
    // Écouter les mises à jour cohérentes provenant du gestionnaire de solde
    const handleConsistentBalanceUpdate = (event: CustomEvent) => {
      const currentBalance = event.detail?.currentBalance;
      const amount = event.detail?.amount;
      
      if (typeof currentBalance === 'number' && currentBalance > 0) {
        // Ne jamais descendre en dessous de la valeur minimale connue
        const validBalance = Math.max(
          currentBalance, 
          minimumDisplayBalance.current
        );
        
        if (validBalance !== localDisplayBalance) {
          animateBalanceUpdate(
            localDisplayBalance, 
            validBalance, 
            800, 
            (value) => setLocalDisplayBalance(value)
          );
        }
      }
    };
    
    // Écouter les événements de début de session pour protéger contre les réinitialisations
    const handleSessionStart = () => {
      // Sauvegarder l'affichage actuel pendant la session
      minimumDisplayBalance.current = Math.max(
        minimumDisplayBalance.current, 
        localDisplayBalance
      );
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:consistent-update' as any, handleConsistentBalanceUpdate);
    window.addEventListener('session:start' as any, handleSessionStart);
    
    // Synchroniser avec la prop isBotActive
    setLocalBotActive(isBotActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:consistent-update' as any, handleConsistentBalanceUpdate);
      window.removeEventListener('session:start' as any, handleSessionStart);
    };
  }, [isBotActive, localDisplayBalance]);

  // Function to toggle bot status manually
  const handleBotToggle = () => {
    const newStatus = !localBotActive;
    setLocalBotActive(newStatus);
    
    // Dispatch global event to sync state across components
    window.dispatchEvent(new CustomEvent('bot:external-status-change', {
      detail: { active: newStatus }
    }));
  };
  
  // Format numbers safely
  const formattedBalance = localDisplayBalance.toFixed(2);
  const formattedAnimatedBalance = animatedBalance.toFixed(2);
  const formattedPreviousBalance = previousBalance.toFixed(2);
  const formattedTotalGenerated = safeTotalGeneratedBalance.toFixed(2);
  const formattedReferralBonus = safeReferralBonus.toFixed(2);
  
  // Calculate if gain happened
  const isGain = animatedBalance > previousBalance;
  
  return (
    <div className="pt-4 pb-6 text-center" ref={balanceRef}>
      <div className="relative">
        <h3 className="text-md opacity-80 mb-1">Solde actuel</h3>
        <div className="flex items-center justify-center">
          <div className="text-5xl font-bold">
            <span className={`transition-colors duration-300 ${balanceAnimating ? (isGain ? 'text-green-300' : 'text-white') : 'text-white'}`}>
              {balanceAnimating ? formattedAnimatedBalance : formattedBalance}
            </span>
            <span className="text-2xl ml-0.5">€</span>
          </div>
        </div>
        
        <div className="text-xs text-green-300 mt-2">
          <div className="flex flex-wrap justify-center gap-1 px-2">
            <span>Bonus parrainage: {formattedReferralBonus}€</span>
            <span className="hidden sm:inline">|</span>
            <span>Total généré: {formattedTotalGenerated}€</span>
          </div>
        </div>
        
        {/* Indicateur de l'état du bot avec option de clic pour basculer */}
        <div 
          className="mt-3 flex items-center justify-center gap-1 cursor-pointer" 
          onClick={handleBotToggle}
          title="Cliquez pour activer/désactiver le bot"
        >
          {localBotActive ? (
            <>
              <Bot size={14} className="text-blue-500" />
              <span className="text-xs text-blue-400 blink-activity">
                Analyse en cours
              </span>
            </>
          ) : (
            <>
              <BotOff size={14} className="text-red-500" />
              <span className="text-xs text-red-300">
                Analyse inactive
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;

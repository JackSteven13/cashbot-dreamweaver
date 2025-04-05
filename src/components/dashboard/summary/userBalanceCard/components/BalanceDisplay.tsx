
import React, { useEffect, useRef } from 'react';
import { Bot, BotOff } from 'lucide-react';

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
  // Ensure we have valid numbers for displaying
  const safeReferralBonus = referralBonus ?? 0;
  const safeTotalGeneratedBalance = totalGeneratedBalance ?? (displayBalance * 1.2);
  
  // Format numbers safely
  const formattedBalance = displayBalance.toFixed(2);
  const formattedAnimatedBalance = animatedBalance.toFixed(2);
  const formattedPreviousBalance = previousBalance.toFixed(2);
  const formattedTotalGenerated = safeTotalGeneratedBalance.toFixed(2);
  const formattedReferralBonus = safeReferralBonus.toFixed(2);
  
  // Calculate if gain happened
  const isGain = animatedBalance > previousBalance;
  
  // Ref pour la fonction d'animation
  const balanceRef = useRef<HTMLDivElement>(null);
  
  // Ajouter la classe pour le ciblage des animations
  useEffect(() => {
    if (balanceRef.current) {
      balanceRef.current.classList.add('balance-display');
    }
  }, []);
  
  return (
    <div className="pt-4 pb-6 text-center" ref={balanceRef}>
      <div className="relative">
        <h3 className="text-md opacity-80 mb-1">Solde actuel</h3>
        <div className="flex items-center justify-center">
          <div className="text-5xl font-bold">
            <span className={`transition-colors duration-300 ${balanceAnimating ? (isGain ? 'text-green-300' : 'text-red-300') : 'text-white'}`}>
              {balanceAnimating ? formattedAnimatedBalance : formattedBalance}
            </span>
            <span className="text-2xl ml-0.5">€</span>
          </div>
        </div>
        
        <div className="text-xs text-green-300 mt-2">
          <div className="flex justify-center gap-2">
            <span>Bonus parrainage: {formattedReferralBonus}€</span>
            <span>|</span>
            <span>Total généré: {formattedTotalGenerated}€</span>
          </div>
        </div>
        
        {/* Indicateur d'activité amélioré */}
        <div className="mt-3 flex items-center justify-center gap-1">
          {isBotActive ? (
            <>
              <Bot size={14} className="text-green-500" />
              <span className="text-xs text-green-300 blink-activity">
                Génération active
              </span>
            </>
          ) : (
            <>
              <BotOff size={14} className="text-red-500" />
              <span className="text-xs text-red-300">
                Génération inactive (limite journalière atteinte)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;

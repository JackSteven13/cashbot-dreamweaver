import React, { useEffect, useState, useRef } from 'react';
import { CircleDollarSign, TrendingUp, Award } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { createMoneyParticles } from '@/utils/animations';
import balanceManager from '@/utils/balance/balanceManager';

interface BalanceDisplayProps {
  displayBalance: number;
  animatedBalance?: number;
  previousBalance?: number;
  balanceAnimating?: boolean;
  referralBonus?: number;
  totalGeneratedBalance?: number;
  isBotActive?: boolean;
  subscription?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  displayBalance,
  animatedBalance,
  previousBalance,
  balanceAnimating = false,
  referralBonus = 0,
  totalGeneratedBalance = 0,
  isBotActive = true,
  subscription = 'freemium'
}) => {
  // S'assurer que displayBalance est toujours un nombre valide
  const safeDisplayBalance = isNaN(displayBalance) ? 0 : displayBalance;
  
  // Utiliser balanceManager comme source unique de vérité avec vérification
  const [stableBalance, setStableBalance] = useState(() => {
    const initialBalance = balanceManager.getCurrentBalance();
    return isNaN(initialBalance) ? safeDisplayBalance : initialBalance;
  });
  
  // État pour suivre les animations
  const [isAnimating, setIsAnimating] = useState(false);
  const [gainAmount, setGainAmount] = useState<number | null>(null);
  
  // Utiliser le solde stable pour l'affichage ou la prop si elle est fournie
  const effectiveBalance = typeof animatedBalance === 'number' && !isNaN(animatedBalance) 
    ? animatedBalance 
    : (isNaN(stableBalance) ? 0 : stableBalance);
  
  const { formattedValue } = useAnimatedCounter({
    value: effectiveBalance,
    duration: 1000,
    decimals: 2
  });
  
  const [showRain, setShowRain] = useState(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  // S'abonner aux changements de solde via balanceManager
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      // Vérifier que la nouvelle valeur est un nombre valide
      if (isNaN(newBalance)) {
        console.error("Balance watcher received NaN value");
        return;
      }
      
      // Get the old balance for comparison
      const oldBalance = stableBalance;
      
      if (Math.abs(newBalance - oldBalance) > 0.01) {
        setStableBalance(newBalance);
        
        // Calculer le gain
        const gain = newBalance - oldBalance;
        if (gain > 0) {
          setGainAmount(gain);
          setIsAnimating(true);
          
          // Effet visuel sur changement significatif
          if (balanceRef.current && gain > 0.01) {
            createMoneyParticles(balanceRef.current, Math.min(10, Math.ceil(gain * 20)));
            setShowRain(true);
            
            // Dispatch animation event for other components
            window.dispatchEvent(new CustomEvent('balance:animation', {
              detail: { 
                oldBalance: oldBalance,
                newBalance: newBalance,
                gain: gain
              }
            }));
            
            const timer = setTimeout(() => {
              setShowRain(false);
              setIsAnimating(false);
              setGainAmount(null);
            }, 3000);
            return () => clearTimeout(timer);
          }
        }
      }
    });
    
    return unsubscribe;
  }, [stableBalance]);
  
  // Synchroniser le solde affiché avec displayBalance quand celui-ci change significativement
  useEffect(() => {
    // S'assurer que toutes les valeurs sont numériques
    const safeDisplayBalance = isNaN(displayBalance) ? 0 : displayBalance;
    const safeStableBalance = isNaN(stableBalance) ? 0 : stableBalance;
    
    if (safeDisplayBalance > 0 && Math.abs(safeDisplayBalance - safeStableBalance) > 0.5) {
      // Si différence significative, synchroniser mais ne pas animer
      setStableBalance(prev => {
        const safePrev = isNaN(prev) ? 0 : prev;
        // Privilégier la valeur la plus élevée pour éviter de décevoir l'utilisateur
        return Math.max(safePrev, safeDisplayBalance);
      });
      
      // Synchroniser aussi le balanceManager
      const currentBalance = balanceManager.getCurrentBalance();
      if (Math.abs(safeDisplayBalance - (isNaN(currentBalance) ? 0 : currentBalance)) > 0.5) {
        balanceManager.forceBalanceSync(safeDisplayBalance);
      }
    }
  }, [displayBalance, stableBalance]);
  
  // Effet pour l'animation lors des gains
  useEffect(() => {
    if ((balanceAnimating || isAnimating) && balanceRef.current) {
      // Effet visuel pour l'animation
      createMoneyParticles(balanceRef.current, 5);
      setShowRain(true);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setShowRain(false);
        setIsAnimating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [balanceAnimating, isAnimating]);
  
  return (
    <div className="mb-4 relative">
      <div 
        ref={balanceRef}
        className={`balance-display text-4xl font-bold mb-1 flex items-center justify-center transition-all duration-300 ${
          balanceAnimating || showRain || isAnimating ? 'text-green-400 glow-effect scale-110' : 'text-white'
        }`}
      >
        <CircleDollarSign 
          size={24} 
          className={`mr-2 ${balanceAnimating || showRain || isAnimating ? 'text-green-400 animate-bounce' : 'text-yellow-400'}`} 
        />
        <span>{formattedValue}€</span>
        
        {/* Afficher le gain s'il y en a un */}
        {gainAmount && (isAnimating || showRain) && (
          <span className="absolute -top-6 right-0 text-sm font-medium text-green-500 animate-float">
            +{gainAmount.toFixed(2)}€
          </span>
        )}
      </div>
      
      <div className="flex justify-between text-xs text-gray-300 mb-3">
        <div className={`flex items-center ${isBotActive ? 'text-green-400' : 'text-amber-400'}`}>
          <TrendingUp size={14} className="mr-1" />
          <span>
            {isBotActive ? 'Génération active' : 'En pause'}
          </span>
        </div>
        
        {referralBonus > 0 && (
          <div className="flex items-center text-blue-400">
            <Award size={14} className="mr-1" />
            <span>+{referralBonus.toFixed(2)}€ bonus</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceDisplay;


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
  // Utiliser balanceManager comme source unique de vérité
  const [stableBalance, setStableBalance] = useState(() => {
    return balanceManager.getStableBalance();
  });
  
  // Utiliser le solde stable pour l'affichage
  const effectiveBalance = animatedBalance !== undefined ? 
    animatedBalance : (stableBalance || displayBalance);
  
  const { formattedValue } = useAnimatedCounter({
    value: effectiveBalance,
    duration: 1000,
    decimals: 2
  });
  
  const [showRain, setShowRain] = useState(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  // S'abonner aux changements de solde via balanceManager
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance, oldBalance) => {
      if (newBalance !== oldBalance) {
        setStableBalance(newBalance);
        
        // Effet visuel sur changement significatif
        if (balanceRef.current && Math.abs(newBalance - oldBalance) > 0.01) {
          createMoneyParticles(balanceRef.current, 3);
          setShowRain(true);
          
          const timer = setTimeout(() => setShowRain(false), 2000);
          return () => clearTimeout(timer);
        }
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Synchroniser le solde affiché avec displayBalance quand celui-ci change
  useEffect(() => {
    if (Math.abs(displayBalance - stableBalance) > 0.5) {
      // Si différence significative, synchroniser mais ne pas animer
      setStableBalance(prev => {
        // Privilégier la valeur la plus élevée pour éviter de décevoir l'utilisateur
        return Math.max(prev, displayBalance);
      });
    }
  }, [displayBalance, stableBalance]);
  
  // Effet pour le confetti lors des changements significatifs
  useEffect(() => {
    if (balanceAnimating && balanceRef.current) {
      // Effet visuel pour l'animation
      createMoneyParticles(balanceRef.current, 5);
      setShowRain(true);
      
      const timer = setTimeout(() => setShowRain(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [balanceAnimating]);
  
  // Écouter les événements de mise à jour du solde pour les animations
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (balanceRef.current && event.detail?.animate !== false) {
        // Créer un effet visuel pour la mise à jour du solde
        createMoneyParticles(balanceRef.current, 3);
        setShowRain(true);
        
        // Réinitialiser l'état après l'animation
        const timer = setTimeout(() => setShowRain(false), 2000);
        return () => clearTimeout(timer);
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    return () => window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
  }, []);
  
  return (
    <div className="mb-4 relative">
      <div 
        ref={balanceRef}
        className={`balance-display text-4xl font-bold mb-1 flex items-center justify-center transition-all duration-300 ${
          balanceAnimating || showRain ? 'text-green-400 glow-effect scale-110' : 'text-white'
        }`}
      >
        <CircleDollarSign 
          size={24} 
          className={`mr-2 ${balanceAnimating || showRain ? 'text-green-400 animate-bounce' : 'text-yellow-400'}`} 
        />
        <span>{formattedValue}€</span>
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

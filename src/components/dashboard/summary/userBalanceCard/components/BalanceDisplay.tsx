
import React, { useEffect, useState, useRef } from 'react';
import { CircleDollarSign, TrendingUp, Award } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { createMoneyParticles } from '@/utils/animations';

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
  const { formattedValue } = useAnimatedCounter({
    value: animatedBalance !== undefined ? animatedBalance : displayBalance,
    duration: 1000,
    decimals: 2
  });
  
  const [showRain, setShowRain] = useState(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  // Effect pour le confetti lors des changements significatifs
  useEffect(() => {
    if (balanceAnimating && balanceRef.current) {
      // Effet visuel pour l'animation
      createMoneyParticles(balanceRef.current, 5);
      setShowRain(true);
      
      const timer = setTimeout(() => setShowRain(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [balanceAnimating]);
  
  return (
    <div className="mb-4 relative">
      <div 
        ref={balanceRef}
        className={`balance-display text-4xl font-bold mb-1 flex items-center justify-center transition-all duration-300 ${
          balanceAnimating ? 'text-green-400 glow-effect scale-110' : 'text-white'
        }`}
      >
        <CircleDollarSign 
          size={24} 
          className={`mr-2 ${balanceAnimating ? 'text-green-400 animate-bounce' : 'text-yellow-400'}`} 
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

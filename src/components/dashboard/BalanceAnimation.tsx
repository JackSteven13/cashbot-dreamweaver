
import React, { useEffect, useState, useRef } from 'react';
import { createMoneyParticles } from '@/utils/animations';

interface BalanceAnimationProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

const BalanceAnimation: React.FC<BalanceAnimationProps> = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  
  // Fixed: Define position class correctly instead of calling a function during render
  const positionClass = React.useMemo(() => {
    switch(position) {
      case 'top-right': return 'top-20 right-8';
      case 'top-left': return 'top-20 left-8';
      case 'bottom-right': return 'bottom-20 right-8';
      case 'bottom-left': return 'bottom-20 left-8';
      case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default: return 'top-20 right-8';
    }
  }, [position]);

  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      console.log("Balance animation received event:", event.type, event.detail);
      const gain = event.detail?.amount || event.detail?.gain || 0;
      const shouldAnimate = event.detail?.animate !== false;
      
      if (gain > 0 && shouldAnimate) {
        setAmount(gain);
        setIsVisible(true);
        
        // Créer des particules si gain significatif
        if (gain >= 0.01 && animationRef.current) {
          // Augmenter significativement le nombre de particules pour un effet plus visible
          const particleCount = Math.min(30, Math.ceil(gain * 50));
          createMoneyParticles(animationRef.current, particleCount);
        }
        
        // Masquer après animation
        setTimeout(() => {
          setIsVisible(false);
        }, 5000); // Durée plus longue pour l'affichage
      }
    };
    
    // Écouter les différents événements de mise à jour du solde
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:animation', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:animation', handleBalanceUpdate as EventListener);
    };
  }, []);

  if (!isVisible) return null;
  
  return (
    <div 
      ref={animationRef}
      className={`fixed ${positionClass} p-4 bg-gradient-to-r from-green-500/80 to-emerald-600/80 rounded-lg shadow-lg z-50 text-white animate-fade-in`}
    >
      <div className="text-lg font-bold mb-1">Transaction réussie</div>
      {amount && (
        <div className="text-2xl font-extrabold">
          +{amount.toFixed(2)}€
        </div>
      )}
    </div>
  );
};

export default BalanceAnimation;

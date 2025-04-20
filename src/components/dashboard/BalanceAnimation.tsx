
import React, { useEffect, useState, useRef } from 'react';
import { createMoneyParticles } from '@/utils/animations';

interface BalanceAnimationProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

const BalanceAnimation: React.FC<BalanceAnimationProps> = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  const positionClassName = getPositionClass(position);

  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const gain = event.detail?.amount || event.detail?.gain || 0;
      const shouldAnimate = event.detail?.animate === true;
      
      if (gain > 0 && shouldAnimate) {
        setAmount(gain);
        setIsVisible(true);
        
        // Créer des particules si gain significatif
        if (gain >= 0.01 && animationRef.current) {
          const particleCount = Math.min(20, Math.ceil(gain * 30));
          createMoneyParticles(animationRef.current, particleCount);
        }
        
        // Masquer après animation
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };
    
    // Écouter les différents événements de mise à jour du solde
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    };
  }, []);
  
  function getPositionClass(position: string): string {
    switch(position) {
      case 'top-right': return 'top-20 right-8';
      case 'top-left': return 'top-20 left-8';
      case 'bottom-right': return 'bottom-20 right-8';
      case 'bottom-left': return 'bottom-20 left-8';
      case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default: return 'top-20 right-8';
    }
  }

  if (!isVisible || !amount) return null;

  return (
    <div 
      ref={animationRef}
      className={`fixed ${positionClassName} z-50 transition-all duration-300 opacity-100`}
    >
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce">
        <span className="text-lg font-bold">+{amount.toFixed(2)}€</span>
      </div>
    </div>
  );
};

export default BalanceAnimation;

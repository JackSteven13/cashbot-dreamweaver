
import React from 'react';
import { Coins } from 'lucide-react';

export interface BalanceHeaderProps {
  className?: string;
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({ className }) => {
  // État pour créer un effet d'animation subtile
  const [animate, setAnimate] = React.useState(false);
  
  // Effet d'animation périodique pour attirer l'attention
  React.useEffect(() => {
    // Animation périodique toutes les 45 secondes
    const animationInterval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1500);
    }, 45000);
    
    // Animation initiale après 3 secondes
    const initialTimeout = setTimeout(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1500);
    }, 3000);
    
    return () => {
      clearInterval(animationInterval);
      clearTimeout(initialTimeout);
    };
  }, []);

  return (
    <div className={`flex justify-between items-center mb-2 ${className || ''}`}>
      <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
        Solde
      </h2>
      <Coins 
        className={`h-5 w-5 text-blue-600 ${animate ? 'animate-pulse' : ''}`} 
      />
    </div>
  );
};

export default BalanceHeader;

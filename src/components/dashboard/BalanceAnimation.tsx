
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface BalanceAnimationProps {
  position?: 'top-right' | 'bottom-right';
}

const BalanceAnimation: React.FC<BalanceAnimationProps> = ({ 
  position = 'top-right'
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [amount, setAmount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  useEffect(() => {
    const handleBalanceUpdate = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        const { gain, amount, animate } = event.detail;
        
        // Determine the amount to display (support different event formats)
        const displayAmount = gain || amount || 0;
        
        // Only animate if explicitly requested or automatic
        if ((animate || event.detail.automatic) && typeof displayAmount === 'number' && displayAmount > 0) {
          setAmount(parseFloat(displayAmount.toFixed(2)));
          setShowAnimation(true);
          setAnimationKey(prev => prev + 1);
          
          // Hide the animation after a delay
          setTimeout(() => {
            setShowAnimation(false);
          }, 3000);
        }
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('automatic:revenue', handleBalanceUpdate as EventListener);
    
    // Add manual trigger for testing
    const testInterval = setInterval(() => {
      // This is just for development to ensure the animation works
      // console.log("Testing balance animation");
    }, 60000);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('automatic:revenue', handleBalanceUpdate as EventListener);
      clearInterval(testInterval);
    };
  }, []);
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            key={animationKey}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>+{amount.toFixed(2)}€</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BalanceAnimation;

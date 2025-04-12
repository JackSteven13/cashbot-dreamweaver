
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface BalanceAnimationProps {
  value: number;
  previousValue?: number;
  isAnimating?: boolean;
  prefix?: string;
  suffix?: string;
}

export function BalanceAnimation({
  value,
  previousValue,
  isAnimating = false,
  prefix = '',
  suffix = '€'
}: BalanceAnimationProps) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    // Start at previous value if available
    const startValue = previousValue !== undefined ? previousValue : value;
    
    // Calculate animation steps
    const steps = 25; // Total animation steps
    const increment = (value - startValue) / steps;
    let currentStep = 0;
    
    // Animation interval
    const animationInterval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(animationInterval);
        setDisplayValue(value); // Ensure we end at exact value
        return;
      }
      
      const nextValue = startValue + (increment * currentStep);
      setDisplayValue(nextValue);
      currentStep++;
    }, 25); // 25ms per step = ~625ms total animation
    
    return () => clearInterval(animationInterval);
  }, [value, previousValue]);
  
  return (
    <div className="relative">
      <span className={`transition-colors duration-300 ${isAnimating ? 'text-green-600 dark:text-green-400' : ''}`}>
        {prefix}{displayValue.toFixed(2)}{suffix}
      </span>
      
      <AnimatePresence>
        {isAnimating && (previousValue !== undefined) && (value > previousValue) && (
          <motion.span 
            className="absolute -top-5 right-0 text-sm font-medium text-green-500"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            +{(value - previousValue).toFixed(2)}{suffix}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BalanceAnimation;

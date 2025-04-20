
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface BalanceAnimationProps {
  value: number;
  previousValue?: number;
  isAnimating?: boolean;
  prefix?: string;
  suffix?: string;
  duration?: number;
  onComplete?: () => void;
}

export function BalanceAnimation({
  value,
  previousValue,
  isAnimating = false,
  prefix = '',
  suffix = '€',
  duration = 1500,
  onComplete
}: BalanceAnimationProps) {
  const [displayValue, setDisplayValue] = useState(previousValue || value);
  const [showFloatingGain, setShowFloatingGain] = useState(false);
  const [gainAmount, setGainAmount] = useState(0);
  
  useEffect(() => {
    // Calculate the amount of gain/loss
    const difference = value - (previousValue || value);
    
    // Only show animation and floating number for positive changes
    if (difference > 0) {
      setGainAmount(difference);
      setShowFloatingGain(true);
      
      // Hide floating gain after animation
      const hideTimer = setTimeout(() => {
        setShowFloatingGain(false);
      }, duration + 500);
      
      return () => clearTimeout(hideTimer);
    }
    
  }, [value, previousValue, duration]);
  
  useEffect(() => {
    // Start at previous value if available, otherwise current value
    const startValue = previousValue !== undefined ? previousValue : value;
    
    // Calculate animation steps - more steps for smoother animation
    const steps = Math.min(60, Math.max(30, Math.ceil(duration / 25))); // At least 30 steps, max 60
    const increment = (value - startValue) / steps;
    
    if (Math.abs(increment) < 0.0001) {
      // Skip animation for very tiny changes
      setDisplayValue(value);
      return;
    }
    
    let currentStep = 0;
    let currentValue = startValue;
    
    // Animation interval
    const animationInterval = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        clearInterval(animationInterval);
        setDisplayValue(value); // Ensure we end at exact value
        if (onComplete) onComplete();
        return;
      }
      
      currentValue += increment;
      setDisplayValue(currentValue);
    }, duration / steps);
    
    return () => clearInterval(animationInterval);
  }, [value, previousValue, duration, onComplete]);
  
  return (
    <div className="relative">
      <span className={`transition-colors duration-500 ${isAnimating ? 'text-green-600 dark:text-green-400' : ''}`}>
        {prefix}{displayValue.toFixed(2)}{suffix}
      </span>
      
      <AnimatePresence>
        {showFloatingGain && gainAmount > 0 && (
          <motion.div 
            className="absolute -top-5 right-0 text-sm font-medium text-green-500 flex items-center"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -15 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
          >
            +{gainAmount.toFixed(2)}{suffix}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BalanceAnimation;

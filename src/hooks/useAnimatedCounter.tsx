
import { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
}

export const useAnimatedCounter = ({ 
  value, 
  duration = 1000, 
  decimals = 2 
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [formattedValue, setFormattedValue] = useState(value.toFixed(decimals));

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = displayValue;
    
    // Don't animate if the values are the same
    if (startValue === value) {
      return;
    }
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = startValue + (value - startValue) * progress;
      
      setDisplayValue(currentValue);
      setFormattedValue(currentValue.toFixed(decimals));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value, duration, decimals]);

  return { displayValue, formattedValue };
};

export default useAnimatedCounter;

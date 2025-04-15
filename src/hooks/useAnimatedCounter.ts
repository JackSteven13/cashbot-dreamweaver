
import { useState, useEffect } from 'react';

interface UseAnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  formatOptions?: Intl.NumberFormatOptions;
}

export const useAnimatedCounter = ({
  value,
  duration = 1000,
  decimals = 0,
  formatOptions = {}
}: UseAnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [formattedValue, setFormattedValue] = useState('0');

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number | null = null;
    const startValue = displayValue;
    const valueChange = value - startValue;
    
    if (Math.abs(valueChange) < 0.01) {
      setDisplayValue(value);
      return;
    }
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Use easeOutQuart for more natural animation
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + valueChange * easeProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    
    frameId = requestAnimationFrame(step);
    
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [value, duration, displayValue]);
  
  // Format the display value and update whenever it changes
  useEffect(() => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...formatOptions
    };
    
    // Format using Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat('fr-FR', options);
    setFormattedValue(formatter.format(displayValue));
  }, [displayValue, decimals, formatOptions]);
  
  return { displayValue, formattedValue };
};

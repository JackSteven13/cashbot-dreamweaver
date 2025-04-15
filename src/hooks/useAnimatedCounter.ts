
import { useState, useEffect, useRef } from 'react';

interface UseAnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  formatOptions?: Intl.NumberFormatOptions;
  easing?: (t: number) => number;
}

export const useAnimatedCounter = ({
  value,
  duration = 1000,
  decimals = 0,
  formatOptions = {},
  easing
}: UseAnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [formattedValue, setFormattedValue] = useState('0');
  const previousValueRef = useRef(value);
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Default easing function (easeOutQuart for more natural animation)
  const defaultEasing = (t: number) => 1 - Math.pow(1 - t, 4);
  const easingFunction = easing || defaultEasing;

  useEffect(() => {
    if (Math.abs(value - previousValueRef.current) < 0.001) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }
    
    // Clean up any existing animation
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    const startValue = previousValueRef.current;
    const valueChange = value - startValue;
    startTimeRef.current = null;
    
    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = easingFunction(progress);
      const currentValue = startValue + valueChange * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
        previousValueRef.current = value;
        animationFrameId.current = null;
      }
    };
    
    animationFrameId.current = requestAnimationFrame(step);
    
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [value, duration, easingFunction]);
  
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
  
  return { 
    displayValue, 
    formattedValue,
    isAnimating: animationFrameId.current !== null
  };
};

export default useAnimatedCounter;

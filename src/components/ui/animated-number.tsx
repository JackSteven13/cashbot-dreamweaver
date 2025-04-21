
import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 1000,
  formatValue = (val) => Math.round(val).toString()
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationFrameRef = useRef<number | null>(null);
  
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
      
      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(step);
      }
    };
    
    animationFrameRef.current = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  return <>{formatValue(displayValue)}</>;
};

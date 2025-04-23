
import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 300, // Durée réduite pour une réactivité instantanée
  formatValue = (val) => Math.round(val).toString()
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationFrameRef = useRef<number | null>(null);
  const previousValue = useRef<number>(value);
  
  useEffect(() => {
    // Skip animation for very small changes to improve performance
    const change = Math.abs(value - previousValue.current);
    if (change < 0.1) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }
    
    let startTime: number | null = null;
    const startValue = displayValue;
    
    // Don't animate if the values are the same
    if (startValue === value) {
      return;
    }
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Use easeOutCubic for even smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (value - startValue) * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(step);
      } else {
        previousValue.current = value;
      }
    };
    
    animationFrameRef.current = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration, displayValue]);

  return <>{formatValue(displayValue)}</>;
};

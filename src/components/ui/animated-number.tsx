
import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 200, // Durée fortement réduite pour une réactivité instantanée
  formatValue = (val) => Math.round(val).toString()
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationFrameRef = useRef<number | null>(null);
  const previousValue = useRef<number>(value);
  const isAnimatingRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Skip animation for very small changes to improve performance
    const change = Math.abs(value - previousValue.current);
    if (change < 0.01 || isAnimatingRef.current) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }
    
    // Skip animation for initial render
    if (previousValue.current === 0 && value > 0) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }
    
    // Don't animate if the values are the same
    if (previousValue.current === value) {
      return;
    }
    
    // Clean up any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    let startTime: number | null = null;
    const startValue = displayValue;
    isAnimatingRef.current = true;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Use easeOutQuart for very smooth but quick animation
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (value - startValue) * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(step);
      } else {
        previousValue.current = value;
        isAnimatingRef.current = false;
        animationFrameRef.current = null;
      }
    };
    
    animationFrameRef.current = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        isAnimatingRef.current = false;
      }
    };
  }, [value, duration, displayValue]);

  return <>{formatValue(displayValue)}</>;
};


import React, { useEffect, useState, useRef, memo } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = memo(({ 
  value, 
  duration = 200, // Durée réduite pour une réactivité instantanée
  formatValue = (val) => Math.round(val).toString()
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationFrameRef = useRef<number | null>(null);
  const previousValueRef = useRef<number>(value);
  const isAnimatingRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Skip animation for very small changes to improve performance
    const change = Math.abs(value - previousValueRef.current);
    if (change < 0.01 || isAnimatingRef.current) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }
    
    // Skip animation for initial render
    if (previousValueRef.current === 0 && value > 0) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }
    
    // Don't animate if the values are the same
    if (previousValueRef.current === value) {
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
        previousValueRef.current = value;
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
});

AnimatedNumber.displayName = 'AnimatedNumber';

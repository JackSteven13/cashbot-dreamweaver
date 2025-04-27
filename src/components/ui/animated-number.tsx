
import React, { useEffect, useState, useRef, memo, useCallback } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = memo(({ 
  value, 
  duration = 400, // Increased for smoother animation
  formatValue = (val) => Math.round(val).toString()
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationFrameRef = useRef<number | null>(null);
  const previousValueRef = useRef<number>(value);
  const isAnimatingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  
  // Memoize the animation function
  const animate = useCallback((startValue: number, targetValue: number, startTime: number, duration: number) => {
    const step = (timestamp: number) => {
      if (!isMountedRef.current) return;
      
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (targetValue - startValue) * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1 && isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        previousValueRef.current = targetValue;
        isAnimatingRef.current = false;
        animationFrameRef.current = null;
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(step);
  }, []);
  
  // Handle component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Handle value changes
  useEffect(() => {
    // Skip animation for very small changes or if already animating
    const change = Math.abs(value - previousValueRef.current);
    if (change < 0.05 || isAnimatingRef.current) {
      if (!isAnimatingRef.current) {
        setDisplayValue(value);
        previousValueRef.current = value;
      }
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
    
    isAnimatingRef.current = true;
    animate(displayValue, value, performance.now(), duration);
    
  }, [value, duration, animate, displayValue]);

  // Avoid unnecessary rerenders by using a stable formatted value
  const formattedValue = formatValue(displayValue);
  return <>{formattedValue}</>;
});

AnimatedNumber.displayName = 'AnimatedNumber';

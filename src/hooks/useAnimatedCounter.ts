
import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  formatOptions?: Intl.NumberFormatOptions;
}

export const useAnimatedCounter = ({
  value,
  duration = 1000,
  decimals = 0,
  formatOptions
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [formattedValue, setFormattedValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  
  // Fonction pour mettre à jour la valeur cible externe
  const setTargetValue = (newTarget: number) => {
    // Annuler l'animation en cours si elle existe
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Démarrer une nouvelle animation vers la nouvelle cible
    animate(prevValueRef.current, newTarget);
  };
  
  // Fonction d'animation
  const animate = (startValue: number, endValue: number) => {
    setIsAnimating(true);
    const startTime = Date.now();
    
    const step = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      if (elapsed >= duration) {
        // Animation terminée
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
        setIsAnimating(false);
        animationFrameRef.current = null;
        return;
      }
      
      // Calculer la valeur actuelle avec easing
      const progress = elapsed / duration;
      const easedProgress = easeOutCubic(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      
      // Mettre à jour la valeur affichée
      setDisplayValue(currentValue);
      
      // Continuer l'animation
      animationFrameRef.current = requestAnimationFrame(step);
    };
    
    // Démarrer l'animation
    step();
  };
  
  // Fonction d'easing pour une animation plus naturelle
  const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
  };
  
  // Formater la valeur pour l'affichage
  useEffect(() => {
    let formatted: string;
    
    if (formatOptions) {
      formatted = new Intl.NumberFormat(undefined, formatOptions).format(displayValue);
    } else {
      formatted = displayValue.toFixed(decimals);
    }
    
    setFormattedValue(formatted);
  }, [displayValue, decimals, formatOptions]);
  
  // Démarrer l'animation lors d'un changement de valeur
  useEffect(() => {
    if (value !== prevValueRef.current) {
      animate(prevValueRef.current, value);
    }
  }, [value, duration]);
  
  // Nettoyer l'animation lors du démontage du composant
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return {
    displayValue,
    formattedValue,
    isAnimating,
    setTargetValue
  };
};

export default useAnimatedCounter;

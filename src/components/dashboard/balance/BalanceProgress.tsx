
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface BalanceProgressProps {
  value: number;
  max: number;
  subscription: string;
}

const BalanceProgress: React.FC<BalanceProgressProps> = ({ value, max, subscription }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Calculer le pourcentage de progression
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    // Animer la progression
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value, max]);
  
  // Déterminer la couleur de la barre de progression selon l'abonnement
  const getProgressColor = () => {
    if (progress > 80) return 'bg-red-500';
    
    switch (subscription) {
      case 'elite':
        return 'bg-purple-600';
      case 'gold':
        return 'bg-amber-500';
      case 'starter':
      case 'alpha':
        return 'bg-blue-500';
      case 'freemium':
      default:
        return 'bg-green-500';
    }
  };
  
  // Obtenir le texte de la limite selon l'abonnement
  const getLimitText = () => {
    switch (subscription) {
      case 'elite':
        return 'Limite Élite';
      case 'gold':
        return 'Limite Gold';
      case 'starter':
      case 'alpha':
        return 'Limite Starter';
      case 'freemium':
      default:
        return 'Limite Gratuite';
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value} / {max} sessions</span>
        <span>{getLimitText()}</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2" 
        indicatorClassName={getProgressColor()}
      />
    </div>
  );
};

export default BalanceProgress;

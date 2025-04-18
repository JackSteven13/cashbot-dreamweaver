
import React from 'react';
import { cn } from '@/lib/utils';

interface BotStatusIndicatorProps {
  active: boolean;
  dailyLimitReached?: boolean;
  pulseAnimation?: boolean;
  className?: string;
}

const BotStatusIndicator: React.FC<BotStatusIndicatorProps> = ({
  active,
  dailyLimitReached = false,
  pulseAnimation = true,
  className
}) => {
  // Déterminer les textes à afficher
  const statusText = active
    ? "Actif"
    : dailyLimitReached
    ? "Limite atteinte"
    : "Inactif";
  
  // Déterminer les classes CSS en fonction de l'état
  const statusClasses = cn(
    "flex items-center gap-2",
    className
  );
  
  const indicatorClasses = cn(
    "flex-shrink-0 h-3 w-3 rounded-full",
    active 
      ? "bg-green-500" 
      : dailyLimitReached
      ? "bg-amber-500"
      : "bg-red-500",
    pulseAnimation && active && "animate-pulse"
  );
  
  return (
    <div className={statusClasses}>
      <span className={indicatorClasses}></span>
      <span className="text-sm font-medium">
        {statusText}
      </span>
    </div>
  );
};

export default BotStatusIndicator;

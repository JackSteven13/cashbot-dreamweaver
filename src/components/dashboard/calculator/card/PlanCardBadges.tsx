
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlanCardBadgesProps {
  mostPopular?: boolean;
  isCurrent?: boolean;
  current?: boolean;
  isSelected?: boolean;
}

const PlanCardBadges: React.FC<PlanCardBadgesProps> = ({ 
  mostPopular, 
  isCurrent, 
  current, 
  isSelected 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {mostPopular && !isMobile && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
          POPULAIRE
        </div>
      )}
      {(isCurrent || current) && (
        <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-br-lg">
          {isMobile ? "ACTUEL" : "ACTUEL"}
        </div>
      )}
      {isSelected && !(isCurrent || current) && (
        <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg z-20">
          SÉLECTIONNÉ
        </div>
      )}
    </>
  );
};

export default PlanCardBadges;


import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCardStyles } from '../styles/useCardStyles';
import { CardStyleProps } from '../types';

interface PlanCardContainerProps extends CardStyleProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const PlanCardContainer: React.FC<PlanCardContainerProps> = ({
  children,
  isSelected,
  mostPopular,
  isCurrent,
  current,
  onClick
}) => {
  const isMobile = useIsMobile();
  const { cardBorderClass, cardBgClass } = useCardStyles({ 
    isSelected, 
    mostPopular, 
    isCurrent, 
    current 
  });

  return (
    <div 
      className={cn(
        "relative rounded-xl shadow-md overflow-hidden transition-all duration-200",
        cardBorderClass,
        cardBgClass,
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      style={{ 
        maxHeight: isMobile ? '300px' : '100%', 
        zIndex: 30,
        width: '100%'
      }}
    >
      {children}
    </div>
  );
};

export default PlanCardContainer;

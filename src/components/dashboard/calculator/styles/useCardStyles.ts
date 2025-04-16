
import { CardStyleProps } from '../types';

export const useCardStyles = ({ 
  isSelected, 
  mostPopular, 
  isCurrent, 
  current 
}: CardStyleProps) => {
  const cardBorderClass = isSelected 
    ? 'border-2 border-x-2 border-purple-500 ring-2 ring-purple-500/40 transform scale-[1.02] z-10'
    : mostPopular 
      ? 'border-2 border-blue-500 ring-2 ring-blue-500/40 transform scale-[1.02] z-10' 
      : 'border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700';
  
  const cardBgClass = isCurrent || current
    ? 'bg-blue-50 dark:bg-blue-900/30'
    : isSelected
      ? 'bg-purple-50/50 dark:bg-purple-900/20'
      : 'bg-white dark:bg-gray-800';
      
  return {
    cardBorderClass,
    cardBgClass
  };
};

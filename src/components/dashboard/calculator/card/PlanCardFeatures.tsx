
import React from 'react';
import { cn } from '@/lib/utils';

interface PlanCardFeaturesProps {
  limit: number;
  features: string[];
  isHomePage?: boolean;
  isMobile?: boolean;
  isSelected?: boolean;
}

const PlanCardFeatures: React.FC<PlanCardFeaturesProps> = ({ 
  limit, 
  features, 
  isHomePage = false, 
  isMobile = false,
  isSelected = false
}) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mb-3">
      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
        Limite quotidienne: <span className="font-semibold text-blue-600 dark:text-blue-400">{limit}€</span>
      </p>
      <ul className="space-y-1 mt-1 overflow-y-auto max-h-[120px] md:max-h-[150px]">
        {features.slice(0, isHomePage ? 2 : isMobile ? 3 : features.length).map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg 
              className={cn(
                "h-3 w-3 md:h-4 md:w-4 shrink-0 mr-1 md:mr-2 mt-0.5",
                isSelected ? 'text-purple-500' : 'text-green-500'
              )} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanCardFeatures;

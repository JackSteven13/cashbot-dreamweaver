
import React from 'react';
import { Control } from 'react-hook-form';
import CalculatorControls from '../CalculatorControls';
import PlanCards from './PlanCards';

interface CalculatorBodyProps {
  control: Control<any>;
  isHomePage?: boolean;
  activeTab: 'controls' | 'results';
  setActiveTab: (tab: 'controls' | 'results') => void;
  isMobile: boolean;
  selectedPlan: string;
  currentSubscription: string;
  calculatedResults: Record<string, { revenue: number, profit: number }>;
  onSelectPlan: (plan: string) => void;
}

const CalculatorBody: React.FC<CalculatorBodyProps> = ({
  control,
  isHomePage = false,
  activeTab,
  setActiveTab,
  isMobile,
  selectedPlan,
  currentSubscription,
  calculatedResults,
  onSelectPlan
}) => {
  // Adapt the layout based on screen size
  if (isMobile) {
    return (
      <div className={`${isHomePage ? 'text-white' : ''}`}>
        {activeTab === 'controls' ? (
          <CalculatorControls 
            control={control} 
            isHomePage={isHomePage} 
          />
        ) : (
          <PlanCards 
            selectedPlan={selectedPlan}
            currentSubscription={currentSubscription}
            calculatedResults={calculatedResults}
            onSelectPlan={onSelectPlan}
            isHomePage={isHomePage}
          />
        )}
      </div>
    );
  }

  // Desktop layout with side-by-side controls and results
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/3">
        <CalculatorControls 
          control={control} 
          isHomePage={isHomePage} 
        />
      </div>
      <div className="w-full md:w-2/3">
        <PlanCards 
          selectedPlan={selectedPlan}
          currentSubscription={currentSubscription}
          calculatedResults={calculatedResults}
          onSelectPlan={onSelectPlan}
          isHomePage={isHomePage}
        />
      </div>
    </div>
  );
};

export default CalculatorBody;


import React from 'react';
import { Form } from '@/components/ui/form';
import { Control } from 'react-hook-form';
import CalculatorControls from '../CalculatorControls';
import PlanCards from './PlanCards';

interface CalculatorBodyProps {
  control: Control<any>;
  isHomePage: boolean;
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
  isHomePage,
  activeTab,
  setActiveTab,
  isMobile,
  selectedPlan,
  currentSubscription,
  calculatedResults,
  onSelectPlan
}) => {
  // Based on mobile vs desktop, show different layouts
  if (isMobile) {
    return activeTab === 'controls' ? (
      <Form>
        <CalculatorControls control={control} isHomePage={isHomePage} />
        <div className="mt-4 text-center">
          <button 
            onClick={() => setActiveTab('results')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Voir les résultats
          </button>
        </div>
      </Form>
    ) : (
      <>
        <div className="space-y-2 md:space-y-3">
          <h3 className={`text-sm md:text-md font-semibold ${isHomePage ? 'text-white dark:text-white' : 'text-[#1e3a5f] dark:text-gray-100'}`}>
            Revenus mensuels estimés
          </h3>
          <PlanCards 
            selectedPlan={selectedPlan}
            currentSubscription={currentSubscription}
            isHomePage={isHomePage}
            calculatedResults={calculatedResults}
            onSelectPlan={onSelectPlan}
          />
        </div>
        <div className="mt-4 text-center">
          <button 
            onClick={() => setActiveTab('controls')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Modifier les paramètres
          </button>
        </div>
      </>
    );
  }

  // Desktop layout
  return (
    <>
      <Form>
        <CalculatorControls control={control} isHomePage={isHomePage} />
      </Form>

      <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
        <h3 className={`text-sm md:text-md font-semibold ${isHomePage ? 'text-white dark:text-white' : 'text-[#1e3a5f] dark:text-gray-100'}`}>
          Revenus mensuels estimés
        </h3>
        <PlanCards 
          selectedPlan={selectedPlan}
          currentSubscription={currentSubscription}
          isHomePage={isHomePage}
          calculatedResults={calculatedResults}
          onSelectPlan={onSelectPlan}
        />
      </div>
    </>
  );
};

export default CalculatorBody;

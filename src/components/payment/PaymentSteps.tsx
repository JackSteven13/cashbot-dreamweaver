
import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { PlanType } from '@/hooks/payment/types';

interface PaymentStepsProps {
  currentStep: 'selection' | 'checkout';
  selectedPlan: PlanType | null;
}

const PaymentSteps: React.FC<PaymentStepsProps> = ({ currentStep, selectedPlan }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          {/* Étape 1: Sélection du plan */}
          <div className="flex flex-col items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center 
              ${currentStep === 'selection' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              {currentStep === 'selection' ? (
                <span>1</span>
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
            </div>
            <span className={`text-xs mt-1 ${currentStep === 'selection' ? 'text-blue-600 font-medium' : 'text-green-600'}`}>
              Sélection
            </span>
          </div>

          {/* Ligne de connexion */}
          <div className="w-10 sm:w-20 h-1 bg-gray-200 mx-1 sm:mx-3">
            <div className={`h-full ${currentStep === 'selection' ? 'bg-gray-200' : 'bg-green-600'} 
              transition-all duration-500 ease-in-out`} 
              style={{ width: currentStep === 'selection' ? '0%' : '100%' }}>
            </div>
          </div>

          {/* Étape 2: Paiement */}
          <div className="flex flex-col items-center">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center 
              ${currentStep === 'checkout' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              <span>2</span>
            </div>
            <span className={`text-xs mt-1 ${currentStep === 'checkout' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Paiement
            </span>
          </div>
        </div>
      </div>

      {selectedPlan && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentStep === 'selection' ? (
              "Choisissez votre offre pour continuer"
            ) : (
              "Finalisez votre paiement pour activer votre abonnement"
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentSteps;

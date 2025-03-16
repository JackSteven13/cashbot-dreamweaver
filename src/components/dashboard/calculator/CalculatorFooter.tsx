
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CalculatorFooterProps {
  isHomePage: boolean;
  selectedPlan: string;
  subscriptionLabels: Record<string, string>;
}

const CalculatorFooter: React.FC<CalculatorFooterProps> = ({
  isHomePage,
  selectedPlan,
  subscriptionLabels
}) => {
  // Styling based on page context
  const buttonClass = isHomePage 
    ? "bg-green-500 hover:bg-green-600 text-white w-full md:w-auto" 
    : "bg-green-600 hover:bg-green-700 text-white";
  
  // Button text based on context
  const buttonText = isHomePage 
    ? "Démarrer et gagner avec CashBot" 
    : `Passer à l'offre ${subscriptionLabels[selectedPlan]}`;

  return (
    <div className="w-full flex justify-center md:justify-end space-x-2">
      <Link to="/register">
        <Button 
          variant="default"
          className={buttonClass}
        >
          {buttonText}
        </Button>
      </Link>
    </div>
  );
};

export default CalculatorFooter;

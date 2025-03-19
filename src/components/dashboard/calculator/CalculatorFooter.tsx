
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';

interface CalculatorFooterProps {
  isHomePage: boolean;
  selectedPlan: string;
  subscriptionLabels: Record<string, string>;
  isCompact?: boolean;
}

const CalculatorFooter: React.FC<CalculatorFooterProps> = ({
  isHomePage,
  selectedPlan,
  subscriptionLabels,
  isCompact = false
}) => {
  const navigate = useNavigate();
  const { session } = useUserSession();
  
  // Updated button styling for better dark mode visibility
  const buttonClass = isHomePage 
    ? `bg-green-500 hover:bg-green-600 text-white ${isCompact ? 'text-sm py-1' : 'w-full md:w-auto'} dark:bg-green-600 dark:hover:bg-green-700 shadow-sm` 
    : `bg-green-600 hover:bg-green-700 text-white ${isCompact ? 'text-sm py-1' : ''} dark:bg-green-500 dark:hover:bg-green-600`;
  
  // Button text based on context
  const buttonText = isHomePage 
    ? isCompact ? "Démarrer avec CashBot" : "Démarrer et gagner avec CashBot" 
    : `Passer à l'offre ${subscriptionLabels[selectedPlan]}`;

  const handleClick = () => {
    if (session) {
      // Already logged in, redirect to payment page with selected plan
      navigate(`/payment?plan=${selectedPlan}`, { state: { plan: selectedPlan } });
    } else {
      // Not logged in, redirect to register page
      navigate('/register');
    }
  };

  return (
    <div className="w-full flex justify-center md:justify-end space-x-2">
      <Button 
        variant="default"
        className={buttonClass}
        onClick={handleClick}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default CalculatorFooter;

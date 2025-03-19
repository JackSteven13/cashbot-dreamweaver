
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';

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
  const navigate = useNavigate();
  const { session } = useUserSession();
  
  // Updated button styling for better dark mode visibility
  const buttonClass = isHomePage 
    ? "bg-green-500 hover:bg-green-600 text-white w-full md:w-auto dark:bg-green-600 dark:hover:bg-green-700 shadow-sm" 
    : "bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600";
  
  // Button text based on context
  const buttonText = isHomePage 
    ? "Démarrer et gagner avec CashBot" 
    : `Passer à l'offre ${subscriptionLabels[selectedPlan]}`;

  const handleClick = () => {
    if (session) {
      // Already logged in, redirect to payment page with selected plan
      console.log("Redirection vers la page de paiement avec plan:", selectedPlan);
      
      // Utiliser setTimeout pour éviter les problèmes potentiels de navigate sur mobile
      setTimeout(() => {
        navigate(`/payment?plan=${selectedPlan}`, { 
          state: { plan: selectedPlan },
          replace: false // Ne pas remplacer l'historique pour permettre de revenir
        });
      }, 50);
    } else {
      // Not logged in, redirect to register page
      console.log("Redirection vers la page d'inscription");
      navigate('/register', { replace: false });
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

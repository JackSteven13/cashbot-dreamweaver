
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
  
  // Amélioration visible du bouton pour un meilleur contraste
  const buttonClass = isHomePage 
    ? "bg-green-500 hover:bg-green-600 text-white w-full md:w-auto dark:bg-green-500 dark:hover:bg-green-600 shadow-md font-bold text-base py-3 px-6" 
    : "bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600 font-bold py-2.5 px-5";
  
  // Texte du bouton selon le contexte
  const buttonText = isHomePage 
    ? "Démarrer et gagner avec Stream Genius" 
    : `Passer à l'offre ${subscriptionLabels[selectedPlan]}`;

  const handleClick = () => {
    if (session) {
      // Déjà connecté, redirection vers la page de paiement avec le plan sélectionné
      console.log("Redirection vers la page de paiement avec plan:", selectedPlan);
      
      setTimeout(() => {
        navigate(`/payment?plan=${selectedPlan}`, { 
          state: { plan: selectedPlan },
          replace: false
        });
      }, 50);
    } else {
      // Non connecté, redirection vers la page d'inscription
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
        size={isHomePage ? "lg" : "default"}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default CalculatorFooter;

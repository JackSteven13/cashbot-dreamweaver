
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TermsFooterProps {
  showCheckoutButton: boolean;
  selectedPlan: string | null;
  handleContinueToCheckout: () => void;
}

const TermsFooter: React.FC<TermsFooterProps> = ({ 
  showCheckoutButton, 
  selectedPlan, 
  handleContinueToCheckout 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="mt-8 pt-4 border-t border-gray-200">
      <p className="text-center text-sm text-gray-500 mb-4">
        En utilisant ce service, vous reconnaissez avoir lu, compris et accepté les présentes conditions générales d'utilisation.
      </p>
      
      {showCheckoutButton && (
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center mb-4 text-blue-600">
            <CheckCircle className="h-6 w-6 mr-2" />
            <span className="text-lg font-medium">J'ai lu et j'accepte les Conditions Générales d'Utilisation</span>
          </div>
          
          <Button 
            onClick={handleContinueToCheckout}
            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center text-lg shadow-md"
          >
            Continuer vers le paiement
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
      
      {!showCheckoutButton && (
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => navigate('/offres')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
          >
            Voir nos offres
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TermsFooter;

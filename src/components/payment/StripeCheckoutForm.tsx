
import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

interface StripeCheckoutFormProps {
  selectedPlan: PlanType | null;
  isStripeProcessing: boolean;
  onCheckout: () => void;
  stripeUrl?: string | null;
}

const StripeCheckoutForm = ({ 
  selectedPlan, 
  isStripeProcessing, 
  onCheckout,
  stripeUrl
}: StripeCheckoutFormProps) => {
  const [termsAccepted, setTermsAccepted] = useState(true);
  
  // Créer le lien vers les CGV avec le plan sélectionné
  const termsLink = selectedPlan ? `/terms?plan=${selectedPlan}` : '/terms';

  const handleCheckout = () => {
    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer.",
        variant: "destructive"
      });
      return;
    }

    // Si nous avons une URL Stripe, rediriger directement
    if (stripeUrl) {
      window.location.href = stripeUrl;
      return;
    }

    // Sinon, déclencher la création de la session
    onCheckout();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#1e3a5f] dark:text-white mb-2">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-medium">Paiement sécurisé par Stripe</h3>
      </div>
      
      <div className="flex items-start space-x-2 py-2">
        <Checkbox 
          id="terms" 
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          className="mt-0.5"
        />
        <div className="grid gap-1 leading-none">
          <Label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-200">
            J'ai lu et j'accepte les{' '}
            <Link 
              to={termsLink} 
              className="text-blue-600 hover:underline focus:outline-none focus:underline dark:text-blue-400" 
              target="_blank"
            >
              Conditions Générales d'Utilisation
            </Link>{' '}
            de la plateforme
          </Label>
        </div>
      </div>
      
      <Button 
        fullWidth 
        className="bg-green-600 hover:bg-green-700 text-white text-base py-3 font-bold shadow-md"
        onClick={handleCheckout}
        isLoading={isStripeProcessing}
        disabled={!termsAccepted || isStripeProcessing}
      >
        {isStripeProcessing ? 'Préparation du paiement...' : 'Procéder au paiement'}
      </Button>
    </div>
  );
};

export default StripeCheckoutForm;

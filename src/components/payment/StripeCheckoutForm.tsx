
import React, { useState, useEffect } from 'react';
import { CreditCard, Lock } from 'lucide-react';
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
  
  // Redirection automatique vers Stripe
  useEffect(() => {
    if (stripeUrl && isStripeProcessing) {
      window.location.href = stripeUrl;
    }
  }, [stripeUrl, isStripeProcessing]);

  const handleCheckout = () => {
    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Redirection vers le paiement",
      description: "Vous allez être redirigé vers notre système de paiement sécurisé...",
    });

    onCheckout();
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <Lock className="h-5 w-5" />
          <h3 className="font-medium">Paiement 100% sécurisé</h3>
        </div>
        <p className="mt-2 text-sm text-green-600 dark:text-green-500">
          Vos informations bancaires sont protégées avec le plus haut niveau de sécurité.
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-[#1e3a5f] dark:text-white">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-medium">Paiement par carte bancaire</h3>
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
              to={`/terms${selectedPlan ? `?plan=${selectedPlan}` : ''}`}
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
        {isStripeProcessing ? 'Redirection vers le paiement...' : 'Payer maintenant'}
      </Button>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Paiement sécurisé par Stripe</p>
        <p>Vos données sont chiffrées et sécurisées</p>
      </div>
    </div>
  );
};

export default StripeCheckoutForm;


import React from 'react';
import { CreditCard } from 'lucide-react';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { openStripeWindow } from '@/hooks/payment/stripeWindowManager';

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
  const [termsAccepted, setTermsAccepted] = React.useState(true); // Default to true for better UX
  const isMobile = useIsMobile();
  
  const handleCheckout = () => {
    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer.",
        variant: "destructive"
      });
      return;
    }
    
    onCheckout();
  };
  
  const handleManualRedirect = () => {
    if (stripeUrl) {
      // Use a direct approach for manual redirection
      console.log("Manual redirect to:", stripeUrl);
      window.open(stripeUrl, "_self");
      
      // Show a toast to confirm the action
      toast({
        title: "Redirection en cours",
        description: "Vous allez être redirigé vers la page de paiement Stripe."
      });
    }
  };
  
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center gap-2 text-[#1e3a5f] mb-1 md:mb-2">
        <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
        <h3 className="font-medium text-sm md:text-base">Paiement sécurisé par Stripe</h3>
      </div>
      
      <div className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
        Vous allez être redirigé vers la plateforme sécurisée de Stripe pour finaliser votre paiement.
      </div>
      
      <div className="flex items-start space-x-2 py-1 md:py-2">
        <Checkbox 
          id="terms" 
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          className="mt-0.5"
        />
        <div className="grid gap-1 leading-none">
          <Label htmlFor="terms" className="text-xs md:text-sm text-gray-700">
            J'ai lu et j'accepte les <Link to="/terms" className="text-blue-600 hover:underline" target="_blank">Conditions Générales d'Utilisation</Link> de la plateforme
          </Label>
        </div>
      </div>
      
      <Button 
        fullWidth 
        className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base py-2.5 md:py-3 font-bold shadow-md"
        onClick={handleCheckout}
        isLoading={isStripeProcessing}
        disabled={!termsAccepted || isStripeProcessing}
      >
        {isStripeProcessing ? 'Redirection en cours...' : 'Procéder au paiement'}
      </Button>
      
      {(isStripeProcessing || stripeUrl) && (
        <Button
          variant="outline"
          fullWidth
          onClick={handleManualRedirect}
          className="mt-3 text-xs md:text-sm py-2 md:py-3 bg-blue-50 hover:bg-blue-100 border-blue-300 font-medium"
        >
          Ouvrir la page de paiement manuellement
        </Button>
      )}
    </div>
  );
};

export default StripeCheckoutForm;

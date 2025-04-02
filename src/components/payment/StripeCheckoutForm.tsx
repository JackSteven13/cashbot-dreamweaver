
import React, { useEffect } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link, useLocation } from 'react-router-dom';
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
  const [termsAccepted, setTermsAccepted] = React.useState(true); // Pré-cochée par défaut
  const [redirectAttempted, setRedirectAttempted] = React.useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
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
    
    setRedirectAttempted(false);
    onCheckout();
  };
  
  // Ouvrir automatiquement la fenêtre Stripe une fois l'URL disponible
  useEffect(() => {
    if (stripeUrl && !redirectAttempted && termsAccepted) {
      setRedirectAttempted(true);
      
      // Notification légère
      toast({
        title: "Redirection en cours",
        description: "Vous êtes redirigé vers la page de paiement Stripe...",
        duration: 3000
      });
      
      // Ouvrir la fenêtre Stripe automatiquement
      openStripeWindow(stripeUrl);
    }
  }, [stripeUrl, redirectAttempted, termsAccepted]);
  
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center gap-2 text-[#1e3a5f] mb-1 md:mb-2">
        <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
        <h3 className="font-medium text-sm md:text-base">Paiement sécurisé par Stripe</h3>
      </div>
      
      <div className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
        Vous serez redirigé vers la plateforme sécurisée de Stripe pour finaliser votre paiement.
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
            J'ai lu et j'accepte les{' '}
            <Link 
              to={termsLink} 
              className="text-blue-600 hover:underline focus:outline-none focus:underline" 
              target="_blank"
              onClick={(e) => {
                // Empêcher les clics multiples rapides
                e.currentTarget.style.pointerEvents = 'none';
                setTimeout(() => {
                  if (e.currentTarget) e.currentTarget.style.pointerEvents = 'auto';
                }, 1000);
              }}
            >
              Conditions Générales d'Utilisation
            </Link>{' '}
            de la plateforme
          </Label>
        </div>
      </div>
      
      <Button 
        fullWidth 
        className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base py-3 md:py-4 font-bold shadow-md flex justify-center items-center gap-2"
        onClick={handleCheckout}
        isLoading={isStripeProcessing && !stripeUrl}
        disabled={!termsAccepted || (isStripeProcessing && !stripeUrl)}
      >
        {isStripeProcessing && !stripeUrl ? 'Préparation du paiement...' : 'Procéder au paiement'}
      </Button>
      
      {stripeUrl && redirectAttempted && (
        <Button 
          fullWidth 
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base py-2.5 md:py-3 flex justify-center items-center gap-2 shadow-md"
          onClick={() => openStripeWindow(stripeUrl)}
        >
          <ExternalLink size={20} />
          Ouvrir à nouveau la page de paiement
        </Button>
      )}
    </div>
  );
};

export default StripeCheckoutForm;

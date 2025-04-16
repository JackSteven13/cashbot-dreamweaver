
import React, { useState } from 'react';
import { CreditCard, Lock, ExternalLink } from 'lucide-react';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { openStripeWindow } from '@/hooks/payment/stripeWindowManager';
import { isMobileDevice } from '@/utils/stripe-helper';

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
  const isMobile = isMobileDevice();
  
  // Fonction de paiement - l'utilisateur doit cliquer manuellement
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
      title: "Préparation du paiement",
      description: "Préparation de votre session de paiement sécurisée...",
      duration: 3000
    });

    onCheckout();
  };

  const handleOpenStripeWindow = () => {
    if (stripeUrl) {
      // Sur mobile, utiliser une redirection directe sans animation
      if (isMobile) {
        window.location.href = stripeUrl;
        return true;
      }
      
      // Sur desktop, tenter d'ouvrir dans un nouvel onglet
      const opened = openStripeWindow(stripeUrl);
      if (!opened) {
        toast({
          title: "Problème d'ouverture",
          description: "Impossible d'ouvrir la page de paiement. Veuillez utiliser le lien direct ci-dessous.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord créer une session de paiement",
        variant: "destructive"
      });
    }
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
      
      {!stripeUrl ? (
        <Button 
          fullWidth 
          className="bg-blue-600 hover:bg-blue-700 text-white text-base py-3 font-bold shadow-md"
          onClick={handleCheckout}
          isLoading={isStripeProcessing}
          disabled={!termsAccepted || isStripeProcessing}
        >
          {isStripeProcessing ? 'Préparation du paiement...' : 'Préparer le paiement'}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button 
            fullWidth 
            className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 text-base py-3 font-bold shadow-md"
            onClick={handleOpenStripeWindow}
            disabled={isStripeProcessing}
          >
            <ExternalLink className="w-4 h-4" /> {isMobile ? 'Continuer vers le paiement' : 'Payer maintenant'}
          </Button>
          
          {isMobile ? (
            <p className="text-sm text-center text-gray-500">
              Vous allez être redirigé vers une page de paiement sécurisée.
            </p>
          ) : (
            <p className="text-sm text-center text-gray-500">
              Vous serez redirigé vers une page de paiement sécurisée pour finaliser votre abonnement.
            </p>
          )}
          
          {!isMobile && (
            <Button 
              fullWidth
              variant="outline"
              className="mt-2 text-sm flex items-center justify-center gap-2"
              onClick={handleOpenStripeWindow}
            >
              <ExternalLink className="w-3 h-3" /> Ouvrir dans une nouvelle fenêtre
            </Button>
          )}
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Paiement sécurisé par Stripe</p>
        <p>Vos données sont chiffrées et sécurisées</p>
      </div>
    </div>
  );
};

export default StripeCheckoutForm;

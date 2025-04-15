
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/hooks/payment/types';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import PlanSummary from './PlanSummary';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { openStripeWindow } from '@/hooks/payment/stripeWindowManager';
import MobilePaymentHelper from './MobilePaymentHelper';
import { ExternalLink, AlertTriangle } from 'lucide-react';

interface PaymentCardProps {
  selectedPlan: PlanType | null;
  currentSubscription: string | null;
  isStripeProcessing: boolean;
  onStripeCheckout: () => void;
  stripeCheckoutUrl: string | null;
}

const PaymentCard = ({
  selectedPlan,
  currentSubscription,
  isStripeProcessing,
  onStripeCheckout,
  stripeCheckoutUrl
}: PaymentCardProps) => {
  const [termsAccepted, setTermsAccepted] = useState(true); // CGV présélectionnées
  const isCurrentPlan = currentSubscription === selectedPlan;
  const [showMobileHelper, setShowMobileHelper] = useState(false);

  // Ouvrir la page de paiement Stripe de manière optimisée
  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un forfait pour continuer",
        variant: "destructive"
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer",
        variant: "destructive"
      });
      return;
    }

    // Notifier l'utilisateur que la redirection est en cours
    toast({
      title: "Préparation du paiement",
      description: "Vous allez être redirigé vers la page de paiement sécurisée...",
      duration: 3000
    });

    // Sauvegarder l'état du paiement
    localStorage.setItem('pendingPayment', 'true');
    
    // Déclencher la création de la session Stripe
    onStripeCheckout();
  };

  // Ouvrir immédiatement Stripe quand l'URL est disponible
  useEffect(() => {
    if (stripeCheckoutUrl && !isStripeProcessing) {
      const openPayment = async () => {
        const opened = openStripeWindow(stripeCheckoutUrl);
        if (!opened) {
          setShowMobileHelper(true);
        }
      };
      openPayment();
    }
  }, [stripeCheckoutUrl, isStripeProcessing]);

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center">Finaliser votre abonnement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlanSummary selectedPlan={selectedPlan} />

        {isCurrentPlan ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">
                Vous êtes déjà abonné à ce forfait. Veuillez en sélectionner un autre ou retourner au tableau de bord.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start space-x-2 py-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
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
              onClick={handlePayment}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium shadow-md"
              disabled={isStripeProcessing || !termsAccepted}
            >
              {isStripeProcessing ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Préparation du paiement...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Payer maintenant
                </div>
              )}
            </Button>
          </>
        )}

        {showMobileHelper && stripeCheckoutUrl && (
          <MobilePaymentHelper 
            isVisible={true}
            onHelp={() => window.location.href = stripeCheckoutUrl}
            stripeUrl={stripeCheckoutUrl}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;

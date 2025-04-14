
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

interface PaymentCardProps {
  selectedPlan: PlanType | null;
  currentSubscription: string | null;
  useStripeCheckout: boolean;
  isStripeProcessing: boolean;
  isProcessing: boolean;
  onToggleMethod: () => void;
  onCardFormSubmit: (formData: any) => void;
  onStripeCheckout: () => void;
  stripeCheckoutUrl: string | null;
}

const PaymentCard = ({
  selectedPlan,
  currentSubscription,
  useStripeCheckout,
  isStripeProcessing,
  isProcessing,
  onToggleMethod,
  onCardFormSubmit,
  onStripeCheckout,
  stripeCheckoutUrl
}: PaymentCardProps) => {
  const [termsAccepted, setTermsAccepted] = useState(true); // CGV présélectionnées
  const isCurrentPlan = currentSubscription === selectedPlan;
  const [showMobileHelper, setShowMobileHelper] = useState(false);

  // Tentative d'ouverture de Stripe après l'obtention de l'URL
  useEffect(() => {
    if (stripeCheckoutUrl && !isStripeProcessing) {
      try {
        console.log("Tentative d'ouverture de Stripe:", stripeCheckoutUrl);
        const opened = openStripeWindow(stripeCheckoutUrl);
        
        // Si l'ouverture échoue, montrer une aide
        if (!opened) {
          setShowMobileHelper(true);
        }
      } catch (error) {
        console.error("Erreur lors de l'ouverture de Stripe:", error);
        setShowMobileHelper(true);
        toast({
          title: "Problème d'ouverture",
          description: "Impossible d'ouvrir la page de paiement automatiquement.",
          variant: "destructive"
        });
      }
    }
  }, [stripeCheckoutUrl, isStripeProcessing]);

  const handleStripePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan pour continuer",
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

    // Déclencher le processus de paiement
    onStripeCheckout();
  };

  const handleManualRedirect = () => {
    if (stripeCheckoutUrl) {
      try {
        window.location.href = stripeCheckoutUrl;
      } catch (e) {
        console.error("Erreur lors de la redirection manuelle:", e);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">Finaliser votre abonnement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlanSummary selectedPlan={selectedPlan} />

        {isCurrentPlan ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Vous êtes déjà abonné à ce forfait. Veuillez en sélectionner un autre ou retourner au tableau de bord.
            </p>
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
              onClick={handleStripePayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-medium shadow-md"
              disabled={isStripeProcessing || !termsAccepted}
            >
              {isStripeProcessing ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Préparation du paiement...
                </div>
              ) : (
                "Payer maintenant"
              )}
            </Button>
            
            {/* Aide à la redirection si besoin */}
            <MobilePaymentHelper 
              isVisible={showMobileHelper} 
              onHelp={handleManualRedirect}
              stripeUrl={stripeCheckoutUrl}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;

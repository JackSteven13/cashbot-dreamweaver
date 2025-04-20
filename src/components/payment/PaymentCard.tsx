
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/hooks/payment/types';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import PlanSummary from './PlanSummary';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Shield, CreditCard } from 'lucide-react';
import { openStripeCheckout } from '@/utils/stripe-helper';

interface PaymentCardProps {
  selectedPlan: PlanType | null;
  currentSubscription: string | null;
  isStripeProcessing: boolean;
  onStripeCheckout: () => void;
  stripeCheckoutUrl: string | null;
  showHelper?: boolean;
  showAnimation?: boolean;
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

  // Fonction de paiement
  const handlePayment = () => {
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

    // Jouer un son de clic pour feedback
    try {
      const audio = new Audio('/sounds/button-click.mp3');
      audio.volume = 0.2;
      audio.play().catch(e => console.log('Son non joué:', e));
    } catch (e) {
      // Ignorer les erreurs de son - non critique
    }

    // Déclencher le processus de paiement
    onStripeCheckout();
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center">Finaliser votre abonnement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlanSummary selectedPlan={selectedPlan} />

        {isCurrentPlan ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-amber-700 dark:text-amber-400">
              Vous êtes déjà abonné à ce forfait. Veuillez sélectionner un autre forfait ou retourner au tableau de bord.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-500">
                <Shield className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Paiement 100% sécurisé</p>
                  <p className="text-xs mt-1">Vos informations bancaires sont protégées par Stripe</p>
                </div>
              </div>
            </div>
            
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
                  <CreditCard className="h-5 w-5" />
                  Procéder au paiement
                </div>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;

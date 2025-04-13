
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlanSummary from '@/components/payment/PlanSummary';
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm';
import ManualPaymentForm from '@/components/payment/ManualPaymentForm';
import { PaymentFormData, PlanType } from '@/hooks/payment/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatPrice } from '@/utils/balance/limitCalculations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { PLANS } from '@/utils/plans';

interface PaymentCardProps {
  selectedPlan: PlanType | null;
  currentSubscription?: string | null;
  useStripeCheckout: boolean;
  isStripeProcessing: boolean;
  isProcessing: boolean;
  onToggleMethod: () => void;
  onCardFormSubmit: (cardData: PaymentFormData) => void;
  onStripeCheckout: () => void;
  stripeCheckoutUrl?: string | null;
}

// Function to calculate prorated price based on days remaining
const calculateProratedPrice = (basePrice: number, daysRemaining: number, totalDays: number): number => {
  return basePrice * (daysRemaining / totalDays);
};

const PaymentCard = ({
  selectedPlan,
  currentSubscription = 'freemium',
  useStripeCheckout,
  isStripeProcessing,
  isProcessing,
  onToggleMethod,
  onCardFormSubmit,
  onStripeCheckout,
  stripeCheckoutUrl
}: PaymentCardProps) => {
  const isMobile = useIsMobile();
  
  // Obtenir le prix réel du plan sélectionné
  const planPrice = selectedPlan && PLANS[selectedPlan] ? PLANS[selectedPlan].price : 0;
  
  // Calculer le prix proraté en cas de mise à niveau
  const isUpgrade = selectedPlan && 
                    currentSubscription && 
                    currentSubscription !== 'freemium';
  
  // Pour une démonstration, supposons que la moitié du temps reste sur l'abonnement actuel
  // Dans une implémentation réelle, vous calculeriez cela à partir des dates d'abonnement
  const daysRemaining = 182; // Environ 6 mois
  const totalDays = 365;
  
  let proratedPrice = 0;
  let savingsAmount = 0;
  
  if (isUpgrade && selectedPlan) {
    const currentPlanPrice = currentSubscription && PLANS[currentSubscription] 
      ? PLANS[currentSubscription].price 
      : 0;
    
    const newPlanPrice = PLANS[selectedPlan].price;
    proratedPrice = newPlanPrice - calculateProratedPrice(currentPlanPrice, daysRemaining, totalDays);
    savingsAmount = newPlanPrice - proratedPrice;
  }

  return (
    <Card className="cyber-card shadow-2xl max-w-[95vw] md:max-w-full mx-auto border border-white/10">
      <CardHeader className="py-4 px-5 md:p-6 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border-b border-white/10">
        <CardTitle className="text-base md:text-xl text-white font-semibold">
          Finaliser votre abonnement {selectedPlan && (selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1))}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-5 p-5 md:p-6">
        <PlanSummary selectedPlan={selectedPlan} />
        
        {isUpgrade && selectedPlan && (
          <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Mise à niveau avec crédit proraté :</span> Comme vous passez de l'offre{' '}
              <span className="font-semibold capitalize">{currentSubscription}</span> à l'offre{' '}
              <span className="font-semibold capitalize">{selectedPlan}</span>, nous appliquons un crédit pour le temps restant sur votre abonnement actuel.
              <div className="mt-2 text-xs space-y-1">
                <div>Prix normal: {formatPrice(planPrice)}</div>
                <div>Crédit appliqué: -{formatPrice(savingsAmount)} ({Math.round((daysRemaining / totalDays) * 100)}% du temps restant)</div>
                <div className="font-semibold pt-1">Vous ne payez que: {formatPrice(proratedPrice)}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {useStripeCheckout ? (
          <StripeCheckoutForm 
            selectedPlan={selectedPlan}
            isStripeProcessing={isStripeProcessing}
            onCheckout={onStripeCheckout}
            stripeUrl={stripeCheckoutUrl}
            isUpgrade={isUpgrade}
            proratedPrice={proratedPrice}
          />
        ) : (
          <ManualPaymentForm 
            isProcessing={isProcessing}
            onSubmit={onCardFormSubmit}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;

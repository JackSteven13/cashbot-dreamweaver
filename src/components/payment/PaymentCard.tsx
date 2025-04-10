
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlanSummary from '@/components/payment/PlanSummary';
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm';
import ManualPaymentForm from '@/components/payment/ManualPaymentForm';
import { PaymentFormData, PlanType, PLAN_PRICES } from '@/hooks/payment/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateProratedPrice, formatPrice } from '@/utils/balance/limitCalculations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
  
  // Calculer le prix proraté si nous faisons une mise à niveau
  const isUpgrade = selectedPlan && 
                    currentSubscription && 
                    currentSubscription !== 'freemium' &&
                    PLAN_PRICES[selectedPlan as keyof typeof PLAN_PRICES] > 
                    PLAN_PRICES[currentSubscription as keyof typeof PLAN_PRICES];
  
  // Pour démontrer, nous supposons qu'il reste 50% du temps sur l'abonnement actuel
  // Dans une implémentation réelle, vous devriez calculer cela à partir des dates d'abonnement
  const daysRemaining = 182; // Environ 6 mois
  const totalDays = 365;
  
  let proratedPrice = 0;
  let savingsAmount = 0;
  
  if (isUpgrade && selectedPlan && currentSubscription) {
    const currentPrice = PLAN_PRICES[currentSubscription as keyof typeof PLAN_PRICES];
    const newPrice = PLAN_PRICES[selectedPlan as keyof typeof PLAN_PRICES];
    proratedPrice = calculateProratedPrice(currentPrice, newPrice, daysRemaining, totalDays);
    savingsAmount = newPrice - proratedPrice;
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
                <div>Prix normal: {formatPrice(PLAN_PRICES[selectedPlan as keyof typeof PLAN_PRICES])}</div>
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


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/hooks/payment/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CardCheckoutForm from './CardCheckoutForm';
import StripeCheckoutForm from './StripeCheckoutForm';
import PlanSummary from './PlanSummary';

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
  const [activeTab, setActiveTab] = useState<string>("stripe");
  const isCurrentPlan = currentSubscription === selectedPlan;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if ((tab === "stripe" && !useStripeCheckout) || (tab === "card" && useStripeCheckout)) {
      onToggleMethod();
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
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="stripe">Payer avec Stripe</TabsTrigger>
              <TabsTrigger value="card">Carte bancaire</TabsTrigger>
            </TabsList>
            <TabsContent value="stripe" className="space-y-4">
              <StripeCheckoutForm 
                selectedPlan={selectedPlan}
                isStripeProcessing={isStripeProcessing}
                onCheckout={onStripeCheckout}
                stripeUrl={stripeCheckoutUrl}
              />
            </TabsContent>
            <TabsContent value="card" className="space-y-4">
              <CardCheckoutForm 
                onSubmit={onCardFormSubmit} 
                isProcessing={isProcessing} 
                selectedPlan={selectedPlan}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/hooks/payment/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CardCheckoutForm from './CardCheckoutForm';
import StripeCheckoutForm from './StripeCheckoutForm';
import PlanSummary from './PlanSummary';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

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

  const handleStripePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan pour continuer",
        variant: "destructive"
      });
      return;
    }

    onStripeCheckout();
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
          <Button 
            onClick={handleStripePayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-medium shadow-md"
            disabled={isStripeProcessing}
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
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/hooks/payment/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CardCheckoutForm from './CardCheckoutForm';
import StripeCheckoutForm from './StripeCheckoutForm';
import PlanSummary from './PlanSummary';
import MobilePaymentHelper from './MobilePaymentHelper';
import { forceOpenStripeUrl } from '@/hooks/payment/stripeWindowManager';

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
  const [showMobileHelper, setShowMobileHelper] = useState(false);
  const [urlAttempted, setUrlAttempted] = useState(false);

  // Vérifier si l'utilisateur a déjà le plan sélectionné
  const isCurrentPlan = currentSubscription === selectedPlan;
  
  // Définir méthode de paiement par défaut (stripe)
  useEffect(() => {
    setActiveTab(useStripeCheckout ? "stripe" : "card");
  }, [useStripeCheckout]);

  // Gérer les changements d'onglet
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if ((tab === "stripe" && !useStripeCheckout) || (tab === "card" && useStripeCheckout)) {
      onToggleMethod();
    }
  };
  
  // Tenter automatiquement d'ouvrir l'URL Stripe si disponible
  useEffect(() => {
    if (stripeCheckoutUrl && !urlAttempted && activeTab === "stripe") {
      console.log("URL Stripe disponible, tentative d'ouverture automatique");
      setUrlAttempted(true);
      
      // Tenter d'ouvrir la fenêtre Stripe avec un léger délai pour permettre au rendu de se terminer
      setTimeout(() => {
        try {
          forceOpenStripeUrl(stripeCheckoutUrl);
        } catch (e) {
          console.error("Erreur lors de l'ouverture forcée:", e);
        }
        
        // Afficher l'aide mobile après un délai si sur mobile
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          setTimeout(() => setShowMobileHelper(true), 3000);
        }
      }, 500);
    }
  }, [stripeCheckoutUrl, urlAttempted, activeTab]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">Finaliser votre abonnement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Afficher le résumé du plan sélectionné */}
        <PlanSummary selectedPlan={selectedPlan} />

        {isCurrentPlan ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Vous êtes déjà abonné à ce forfait. Veuillez en sélectionner un autre ou retourner au tableau de bord.
            </p>
          </div>
        ) : (
          <>
            {/* Onglets pour les méthodes de paiement */}
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
                
                <MobilePaymentHelper 
                  isVisible={showMobileHelper} 
                  onHelp={() => {
                    if (stripeCheckoutUrl) {
                      forceOpenStripeUrl(stripeCheckoutUrl);
                    }
                  }}
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;

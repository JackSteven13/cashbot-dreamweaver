
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/hooks/payment/types';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import PlanSummary from './PlanSummary';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { openStripeWindow, recoverStripeSession } from '@/hooks/payment/stripeWindowManager';
import MobilePaymentHelper from './MobilePaymentHelper';
import { ExternalLink, AlertTriangle, CreditCard } from 'lucide-react';

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

  // Tenter de récupérer une session interrompue au chargement
  useEffect(() => {
    // Si on est sur la page de paiement et qu'une session existe, essayer de la récupérer
    const pendingSession = localStorage.getItem('pendingPayment') === 'true';
    
    if (pendingSession) {
      toast({
        title: "Paiement en attente",
        description: "Reprise de votre dernière session de paiement..."
      });
      // Effacer immédiatement pour éviter des boucles
      localStorage.removeItem('pendingPayment');
      
      // Laisser le temps à l'interface de charger avant de rediriger
      setTimeout(() => {
        if (stripeCheckoutUrl) {
          openStripePayment();
        } else {
          // Si pas d'URL de checkout mais session en attente, initier un nouveau paiement
          handleStripePayment();
        }
      }, 1000);
    }
  }, []);

  // Ouvrir la page de paiement Stripe de manière optimisée
  const openStripePayment = () => {
    if (!stripeCheckoutUrl) return false;
    
    try {
      console.log(`Tentative d'ouverture de Stripe:`, stripeCheckoutUrl);
      
      // Marquer le paiement comme en cours pour récupération potentielle
      localStorage.setItem('pendingPayment', 'true');
      
      // Utiliser la fonction optimisée
      const opened = openStripeWindow(stripeCheckoutUrl);
      
      // Afficher toujours l'aide mobile pour maximiser les chances de réussite
      setShowMobileHelper(true);
      
      // Si réussi, montrer une notification de succès
      if (opened) {
        toast({
          title: "Redirection en cours",
          description: "La page de paiement sécurisée s'ouvre. Si rien ne se passe, utilisez les options ci-dessous.",
          duration: 7000,
        });
      }
      
      return opened;
    } catch (error) {
      console.error("Erreur lors de l'ouverture de Stripe:", error);
      setShowMobileHelper(true);
      return false;
    }
  };

  // Ouvrir Stripe immédiatement dès que l'URL est disponible
  useEffect(() => {
    if (stripeCheckoutUrl && !isStripeProcessing) {
      openStripePayment();
    }
  }, [stripeCheckoutUrl, isStripeProcessing]);

  // Initier le processus de paiement après vérification des conditions
  const handleStripePayment = async () => {
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
    
    toast({
      title: "Préparation du paiement",
      description: "Veuillez patienter pendant que nous préparons votre paiement sécurisé...",
      duration: 5000
    });
    
    // Marquer le paiement comme en cours
    localStorage.setItem('pendingPayment', 'true');
    
    // Déclencher le processus de paiement
    onStripeCheckout();
  };

  // Forcer la redirection directe vers Stripe
  const handleManualRedirect = () => {
    if (stripeCheckoutUrl) {
      try {
        toast({
          title: "Redirection en cours",
          description: "Vous allez être redirigé vers la page de paiement Stripe."
        });
        
        // Force la redirection directe vers l'URL Stripe
        window.location.href = stripeCheckoutUrl;
      } catch (e) {
        console.error("Erreur lors de la redirection manuelle:", e);
        toast({
          title: "Erreur de redirection",
          description: "Veuillez copier le lien et l'ouvrir manuellement dans votre navigateur.",
          variant: "destructive"
        });
      }
    }
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

            {!stripeCheckoutUrl ? (
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
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payer maintenant
                  </div>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={openStripePayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-4 rounded-lg font-medium shadow-md"
                  disabled={isStripeProcessing}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir la page de paiement
                </Button>
                
                {/* Afficher toujours l'aide au paiement pour une fiabilité maximale */}
                <MobilePaymentHelper 
                  isVisible={true} 
                  onHelp={handleManualRedirect}
                  stripeUrl={stripeCheckoutUrl}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCard;

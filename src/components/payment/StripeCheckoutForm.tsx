
import React, { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, AlertCircle } from 'lucide-react';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link, useLocation } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { openStripeWindow } from '@/hooks/payment/stripeWindowManager';
import MobilePaymentHelper from './MobilePaymentHelper';
import { formatPrice } from '@/utils/balance/limitCalculations';

interface StripeCheckoutFormProps {
  selectedPlan: PlanType | null;
  isStripeProcessing: boolean;
  onCheckout: () => void;
  stripeUrl?: string | null;
  isUpgrade?: boolean;
  proratedPrice?: number;
}

const StripeCheckoutForm = ({ 
  selectedPlan, 
  isStripeProcessing, 
  onCheckout,
  stripeUrl,
  isUpgrade = false,
  proratedPrice = 0
}: StripeCheckoutFormProps) => {
  const [termsAccepted, setTermsAccepted] = useState(true); // Pré-cochée par défaut
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [showMobileHelper, setShowMobileHelper] = useState(false);
  const [stripeWindowOpened, setStripeWindowOpened] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Créer le lien vers les CGV avec le plan sélectionné
  const termsLink = selectedPlan ? `/terms?plan=${selectedPlan}` : '/terms';
  
  // Traiter le clic sur le bouton de checkout
  const handleCheckout = () => {
    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer.",
        variant: "destructive"
      });
      return;
    }
    
    // Si nous avons déjà une URL Stripe et que l'utilisateur clique à nouveau
    if (stripeUrl && redirectAttempted) {
      openStripePayment();
      return;
    }
    
    setRedirectAttempted(false);
    onCheckout();
  };
  
  // Fonction pour ouvrir la fenêtre de paiement Stripe avec gestion améliorée
  const openStripePayment = () => {
    if (!stripeUrl) return;
    
    // Mémoriser l'URL dans le localStorage en cas de problème
    localStorage.setItem('stripeCheckoutUrl', stripeUrl);
    localStorage.setItem('stripeRedirectPending', 'true');
    
    console.log("Tentative d'ouverture de la page de paiement:", stripeUrl);
    
    // Tenter d'ouvrir la fenêtre Stripe avec la fonction améliorée
    const opened = openStripeWindow(stripeUrl);
    setStripeWindowOpened(opened);
    
    if (opened) {
      toast({
        title: "Redirection en cours",
        description: "Vous êtes redirigé vers la page de paiement Stripe...",
        duration: 3000
      });
    } else {
      // Si la fenêtre n'a pas pu être ouverte (probablement bloquée)
      toast({
        title: "Problème de redirection",
        description: "La redirection va s'effectuer automatiquement dans quelques secondes...",
        variant: "default",
        duration: 8000
      });
      setShowMobileHelper(true);
      
      // Tentative de redirection directe après quelques secondes
      setTimeout(() => {
        window.location.href = stripeUrl;
      }, 2000);
    }
  };
  
  // Ouvrir automatiquement la fenêtre Stripe une fois l'URL disponible
  useEffect(() => {
    if (stripeUrl && !redirectAttempted && termsAccepted) {
      setRedirectAttempted(true);
      
      // Petit délai pour permettre à l'interface de se mettre à jour
      setTimeout(() => {
        openStripePayment();
      }, 300);
      
      // Sur mobile, afficher l'aide après un court délai si nécessaire
      if (isMobile) {
        setTimeout(() => {
          setShowMobileHelper(true);
        }, 3000);
      }
    }
  }, [stripeUrl, redirectAttempted, termsAccepted, isMobile]);
  
  // Vérifier s'il y a une URL en attente dans localStorage
  useEffect(() => {
    const pendingUrl = localStorage.getItem('stripeCheckoutUrl');
    const isPending = localStorage.getItem('stripeRedirectPending') === 'true';
    
    if (pendingUrl && isPending && !stripeUrl) {
      console.log("URL de redirection en attente détectée:", pendingUrl);
      // Effacer le flag de redirection en attente
      localStorage.setItem('stripeRedirectPending', 'false');
      
      // Après un petit délai, tenter d'ouvrir l'URL
      setTimeout(() => {
        openStripeWindow(pendingUrl);
      }, 1000);
    }
  }, []);
  
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center gap-2 text-[#1e3a5f] dark:text-white mb-2 md:mb-3">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-medium text-base md:text-lg">
          Paiement sécurisé par Stripe{isUpgrade && " - Mise à niveau"}
        </h3>
      </div>
      
      <div className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3 md:mb-5">
        {isUpgrade ? (
          <span>
            Vous effectuez une mise à niveau vers un abonnement supérieur. Le montant facturé ({formatPrice(proratedPrice)}) 
            tient compte du temps restant sur votre abonnement actuel.
          </span>
        ) : (
          <span>
            Vous serez redirigé vers la plateforme sécurisée de Stripe pour finaliser votre paiement.
          </span>
        )}
      </div>
      
      <div className="flex items-start space-x-2 py-2 md:py-3">
        <Checkbox 
          id="terms" 
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          className="mt-0.5"
        />
        <div className="grid gap-1 leading-none">
          <Label htmlFor="terms" className="text-sm md:text-base text-gray-700 dark:text-gray-200">
            J'ai lu et j'accepte les{' '}
            <Link 
              to={termsLink} 
              className="text-blue-600 hover:underline focus:outline-none focus:underline dark:text-blue-400" 
              target="_blank"
              onClick={(e) => {
                e.stopPropagation(); // Empêcher les clics croisés
              }}
            >
              Conditions Générales d'Utilisation
            </Link>{' '}
            de la plateforme
          </Label>
        </div>
      </div>
      
      <Button 
        fullWidth 
        className="bg-green-600 hover:bg-green-700 text-white text-base md:text-lg py-3 md:py-4 font-bold shadow-md flex justify-center items-center gap-2 mt-4"
        onClick={handleCheckout}
        isLoading={isStripeProcessing && !stripeUrl}
        disabled={!termsAccepted || (isStripeProcessing && !stripeUrl)}
      >
        {isStripeProcessing && !stripeUrl ? 'Préparation du paiement...' : (
          stripeUrl ? 'Continuer vers le paiement' : 
          (isUpgrade ? `Procéder à la mise à niveau (${formatPrice(proratedPrice)})` : 'Procéder au paiement')
        )}
      </Button>
      
      {stripeUrl && redirectAttempted && (
        <Button 
          fullWidth 
          className="bg-blue-600 hover:bg-blue-700 text-white text-base py-3 md:py-4 flex justify-center items-center gap-2 shadow-md mt-3"
          onClick={() => openStripePayment()}
        >
          <ExternalLink size={20} />
          Ouvrir à nouveau la page de paiement
        </Button>
      )}
      
      <MobilePaymentHelper 
        isVisible={showMobileHelper && !!stripeUrl} 
        onHelp={() => openStripePayment()}
      />
    </div>
  );
};

export default StripeCheckoutForm;

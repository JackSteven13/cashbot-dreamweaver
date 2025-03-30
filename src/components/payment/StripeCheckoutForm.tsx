
import React, { useEffect, useState } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';
import Button from '@/components/Button';
import { PlanType } from '@/hooks/payment/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link, useLocation } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

interface StripeCheckoutFormProps {
  selectedPlan: PlanType | null;
  isStripeProcessing: boolean;
  onCheckout: () => void;
  stripeUrl?: string | null;
}

const StripeCheckoutForm = ({ 
  selectedPlan, 
  isStripeProcessing, 
  onCheckout,
  stripeUrl
}: StripeCheckoutFormProps) => {
  const [termsAccepted, setTermsAccepted] = React.useState(true); // Par défaut à true pour une meilleure UX
  const [redirectAttempted, setRedirectAttempted] = React.useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(3);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Compte à rebours pour la redirection automatique
  useEffect(() => {
    if (stripeUrl && isStripeProcessing && !redirectAttempted && redirectSeconds > 0) {
      const timer = setTimeout(() => {
        setRedirectSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stripeUrl, isStripeProcessing, redirectAttempted, redirectSeconds]);
  
  const handleCheckout = () => {
    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer.",
        variant: "destructive"
      });
      return;
    }
    
    setRedirectAttempted(false);
    setRedirectSeconds(3);
    onCheckout();
  };
  
  const handleManualRedirect = () => {
    if (!stripeUrl) {
      toast({
        title: "URL de paiement manquante",
        description: "Impossible de vous rediriger vers la page de paiement. Veuillez réessayer.",
        variant: "destructive"
      });
      return;
    }
    
    setRedirectAttempted(true);
    
    // Notification claire à l'utilisateur
    toast({
      title: "Ouverture de la page de paiement",
      description: "Vous allez être redirigé vers Stripe...",
      duration: 3000
    });
    
    // Redirection directe - méthode plus agressive
    try {
      // Ouvrir dans un nouvel onglet (plus compatible sur mobile)
      window.open(stripeUrl, "_blank");
      
      // Redirection secondaire après un court délai si l'ouverture d'onglet échoue
      setTimeout(() => {
        window.location.href = stripeUrl;
      }, 100);
    } catch (error) {
      console.error("Erreur lors de la redirection:", error);
      
      // Solution de dernier recours
      window.location.href = stripeUrl;
    }
  };
  
  // Créer le lien vers les CGV avec le plan sélectionné
  const termsLink = selectedPlan ? `/terms?plan=${selectedPlan}` : '/terms';
  
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center gap-2 text-[#1e3a5f] mb-1 md:mb-2">
        <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
        <h3 className="font-medium text-sm md:text-base">Paiement sécurisé par Stripe</h3>
      </div>
      
      <div className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
        Vous serez redirigé vers la plateforme sécurisée de Stripe pour finaliser votre paiement.
      </div>
      
      <div className="flex items-start space-x-2 py-1 md:py-2">
        <Checkbox 
          id="terms" 
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          className="mt-0.5"
        />
        <div className="grid gap-1 leading-none">
          <Label htmlFor="terms" className="text-xs md:text-sm text-gray-700">
            J'ai lu et j'accepte les <Link to={termsLink} className="text-blue-600 hover:underline" target="_blank">Conditions Générales d'Utilisation</Link> de la plateforme
          </Label>
        </div>
      </div>
      
      {stripeUrl ? (
        <>
          {/* Bouton de redirection principal - grand et très visible */}
          <a 
            href={stripeUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block w-full"
          >
            <Button 
              fullWidth 
              className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base py-3 md:py-4 font-bold shadow-md flex justify-center items-center gap-2"
              onClick={() => setRedirectAttempted(true)}
            >
              <ExternalLink size={20} />
              Ouvrir la page de paiement Stripe
            </Button>
          </a>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs md:text-sm text-blue-700 mt-2">
            <p className="font-semibold">Important :</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Cliquez sur le bouton vert ci-dessus pour ouvrir la page de paiement</li>
              <li>Si rien ne se passe, vérifiez que les popups sont autorisés</li>
              <li>Vous pouvez aussi essayer en mode navigation privée ou avec un autre navigateur</li>
            </ul>
          </div>
        </>
      ) : (
        <Button 
          fullWidth 
          className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base py-2.5 md:py-3 font-bold shadow-md"
          onClick={handleCheckout}
          isLoading={isStripeProcessing && !stripeUrl}
          disabled={!termsAccepted || (isStripeProcessing && !stripeUrl)}
        >
          {isStripeProcessing && !stripeUrl ? `Redirection en cours...` : 'Procéder au paiement'}
        </Button>
      )}
      
      {isMobile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs text-yellow-800 mt-2">
          <p className="font-semibold">Sur les appareils mobiles :</p>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>Assurez-vous que les popups sont autorisés</li>
            <li>Utilisez le bouton vert ci-dessus si la redirection ne se fait pas</li>
            <li>Si rien ne fonctionne, essayez un autre navigateur</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default StripeCheckoutForm;

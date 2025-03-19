
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlanType } from '@/hooks/payment/types';
import { toast } from "@/components/ui/use-toast";
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface StripeCheckoutFormProps {
  selectedPlan: PlanType | null;
  isStripeProcessing: boolean;
  onCheckout: () => void;
}

const StripeCheckoutForm = ({ 
  selectedPlan, 
  isStripeProcessing, 
  onCheckout 
}: StripeCheckoutFormProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  
  // If it's freemium plan, don't display the form
  if (selectedPlan === 'freemium') {
    return (
      <div className="text-center">
        <p className="text-green-600 font-medium mb-4">L'abonnement Freemium est gratuit et ne nécessite pas de paiement.</p>
        <Link to="/dashboard">
          <Button className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white">
            Aller au tableau de bord
          </Button>
        </Link>
      </div>
    );
  }
  
  // Retenter automatiquement la redirection si la page ne s'est pas ouverte
  useEffect(() => {
    let timer: number;
    if (isStripeProcessing && hasClicked) {
      timer = window.setTimeout(() => {
        console.log("Retentative automatique de redirection vers Stripe");
        if (isStripeProcessing) {
          onCheckout();
        }
      }, 3000);
    }
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isStripeProcessing, hasClicked, onCheckout]);
  
  const handleCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Initiating Stripe checkout from button click");
      setHasClicked(true);
      onCheckout();
      
      // Forcer l'ouverture dans un nouvel onglet si la redirection échoue
      if (selectedPlan && selectedPlan !== 'freemium') {
        const timer = window.setTimeout(() => {
          if (isStripeProcessing) {
            toast({
              title: "Redirection en cours",
              description: "Si la page de paiement ne s'ouvre pas automatiquement, veuillez réessayer.",
            });
          }
        }, 1500);
        
        return () => window.clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'initier le paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-center">
        <p className="text-[#1e3a5f] mb-2">Vous allez être redirigé vers Stripe pour un paiement sécurisé</p>
        <p className="text-sm text-[#486581]">Votre abonnement sera activé immédiatement après le paiement</p>
      </div>
      
      <div className="flex items-start space-x-2 py-2">
        <Checkbox 
          id="terms" 
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          className="mt-0.5"
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="terms" className="text-sm text-gray-700">
            J'ai lu et j'accepte les <Link to="/terms" className="text-blue-600 hover:underline" target="_blank">Conditions Générales d'Utilisation</Link> de la plateforme
          </Label>
        </div>
      </div>
      
      <Button 
        className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white w-full py-2 px-4"
        onClick={handleCheckout}
        disabled={isStripeProcessing || !termsAccepted}
        type="button"
      >
        {isStripeProcessing ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirection en cours...
          </span>
        ) : 'Payer avec Stripe'}
      </Button>
      
      {/* Afficher un message et un lien de secours si la redirection échoue */}
      {isStripeProcessing && hasClicked && (
        <div className="text-xs text-center mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded">
          <p className="text-yellow-700 mb-1">
            Si vous n'êtes pas redirigé automatiquement dans quelques secondes :
          </p>
          <Button
            variant="link"
            className="text-blue-600 p-0 h-auto font-normal"
            onClick={() => onCheckout()}
          >
            Cliquez ici pour ouvrir la page de paiement
          </Button>
        </div>
      )}
    </div>
  );
};

export default StripeCheckoutForm;

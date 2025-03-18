
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanType } from '@/hooks/payment/types';
import { toast } from "@/components/ui/use-toast";
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
      onCheckout();
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
        {isStripeProcessing ? 'Traitement en cours...' : 'Payer avec Stripe'}
      </Button>
      
      {/* Bouton de secours pour ouvrir la page manuellement si besoin */}
      {isStripeProcessing && (
        <p className="text-xs text-center text-gray-500 mt-2">
          Si la page de paiement ne s'ouvre pas automatiquement, veuillez cliquer à nouveau sur le bouton.
        </p>
      )}
    </div>
  );
};

export default StripeCheckoutForm;

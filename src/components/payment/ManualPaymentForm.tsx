
import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import Button from '@/components/Button';
import CardPaymentForm from '@/components/payment/CardPaymentForm';
import { PaymentFormData } from '@/hooks/payment/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link, useLocation } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

interface ManualPaymentFormProps {
  isProcessing: boolean;
  onSubmit: (formData: PaymentFormData) => void;
}

const ManualPaymentForm = ({ isProcessing, onSubmit }: ManualPaymentFormProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Extraire le plan depuis les paramètres de l'URL pour le passer au lien des CGV
  const selectedPlan = new URLSearchParams(location.search).get('plan');
  
  const handleFormSubmit = () => {
    if (!termsAccepted) {
      toast({
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions générales pour continuer.",
        variant: "destructive"
      });
      return;
    }
    
    const formData = document.getElementById('card-payment-form') as HTMLFormElement;
    if (formData) {
      formData.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  };
  
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center gap-2 text-[#1e3a5f] mb-1 md:mb-2">
        <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
        <h3 className="font-medium text-sm md:text-base">Paiement par carte</h3>
      </div>
      
      <CardPaymentForm onSubmit={onSubmit} />
      
      <div className="flex items-start space-x-2 py-1 md:py-2">
        <Checkbox 
          id="terms-manual" 
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          className="mt-0.5"
        />
        <div className="grid gap-1 leading-none">
          <Label htmlFor="terms-manual" className="text-xs md:text-sm text-gray-700">
            J'ai lu et j'accepte les <Link to={`/terms${selectedPlan ? `?plan=${selectedPlan}` : ''}`} className="text-blue-600 hover:underline" target="_blank">Conditions Générales d'Utilisation</Link> de la plateforme
          </Label>
        </div>
      </div>
    
      <Button 
        fullWidth 
        className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white text-sm md:text-base py-1.5 md:py-2"
        onClick={handleFormSubmit}
        isLoading={isProcessing}
        disabled={!termsAccepted}
      >
        {isProcessing ? 'Traitement en cours...' : 'Payer maintenant'}
      </Button>
    </div>
  );
};

export default ManualPaymentForm;

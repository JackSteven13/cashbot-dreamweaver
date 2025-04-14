
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PlanType } from '@/hooks/payment/types';
import { CreditCard } from 'lucide-react';

interface CardCheckoutFormProps {
  onSubmit: (formData: any) => void;
  isProcessing: boolean;
  selectedPlan: PlanType | null;
}

const CardCheckoutForm = ({ onSubmit, isProcessing, selectedPlan }: CardCheckoutFormProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      cardNumber: formData.get('cardNumber'),
      cardName: formData.get('cardName'),
      expiryDate: formData.get('expiryDate'),
      cvv: formData.get('cvv')
    };
    
    onSubmit(data);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-[#1e3a5f] dark:text-white mb-2">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-medium">Paiement par carte bancaire</h3>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="cardName">Nom sur la carte</Label>
          <Input 
            id="cardName" 
            name="cardName" 
            placeholder="John Doe" 
            required
            disabled={isProcessing}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Numéro de carte</Label>
          <Input 
            id="cardNumber" 
            name="cardNumber" 
            placeholder="1234 5678 9012 3456" 
            required
            disabled={isProcessing}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Date d'expiration</Label>
            <Input 
              id="expiryDate" 
              name="expiryDate" 
              placeholder="MM/YY" 
              required
              disabled={isProcessing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input 
              id="cvv" 
              name="cvv" 
              placeholder="123" 
              required
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
      
      <Button 
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-3 font-bold shadow-md"
        disabled={isProcessing || !selectedPlan}
      >
        {isProcessing ? 'Traitement en cours...' : 'Procéder au paiement'}
      </Button>
    </form>
  );
};

export default CardCheckoutForm;

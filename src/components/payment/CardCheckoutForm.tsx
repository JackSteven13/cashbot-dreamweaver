
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { PlanType } from '@/hooks/payment/types';
import { PLANS } from '@/utils/plans';

interface CardCheckoutFormProps {
  onSubmit: (formData: any) => void;
  isProcessing: boolean;
  selectedPlan: PlanType | null;
}

const CardCheckoutForm: React.FC<CardCheckoutFormProps> = ({ 
  onSubmit, 
  isProcessing,
  selectedPlan
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format des données à envoyer
    const formData = {
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardName,
      expiryDate,
      cvv,
      plan: selectedPlan
    };
    
    onSubmit(formData);
  };

  // Formatter le numéro de carte en groupes de 4 chiffres
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="bg-muted/50 p-4 rounded-md mb-4">
          <p className="text-sm font-medium">
            Forfait sélectionné: <span className="font-bold">{selectedPlan ? PLANS[selectedPlan]?.name : 'Aucun'}</span>
          </p>
          <p className="text-sm">
            Prix: <span className="font-bold">{selectedPlan ? `${PLANS[selectedPlan]?.price}€` : '0€'}</span>
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="card-name">Nom sur la carte</Label>
          <Input
            id="card-name"
            placeholder="John Doe"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="card-number">Numéro de carte</Label>
          <Input
            id="card-number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card-expiry">Date d'expiration (MM/YY)</Label>
            <Input
              id="card-expiry"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              maxLength={5}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="card-cvv">CVV</Label>
            <Input
              id="card-cvv"
              type="password"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              maxLength={3}
              required
            />
          </div>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>Valider le paiement</>
        )}
      </Button>
    </form>
  );
};

export default CardCheckoutForm;


import React, { useState, FormEvent } from 'react';
import { CreditCard } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { PaymentFormData } from '@/hooks/payment/types';

interface CardPaymentFormProps {
  onSubmit: (formData: PaymentFormData) => void;
}

const CardPaymentForm = ({ onSubmit }: CardPaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = '';
    
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += digits[i];
    }
    
    return formattedValue.slice(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits;
    }
    
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatExpiry(e.target.value));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvc(value.slice(0, 3));
  };
  
  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardHolder(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      cardNumber,
      cardHolder,
      expiryDate: expiry,
      cvv: cvc,
      expiry, // For compatibility
      cvc     // For compatibility
    });
  };

  return (
    <form id="card-payment-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="card-holder" className="block text-sm font-medium text-[#334e68] mb-1">
          Nom du titulaire
        </label>
        <Input
          type="text"
          id="card-holder"
          value={cardHolder}
          onChange={handleCardHolderChange}
          placeholder="John Doe"
          className="w-full"
          required
        />
      </div>
      
      <div>
        <label htmlFor="card-number" className="block text-sm font-medium text-[#334e68] mb-1">
          Numéro de carte
        </label>
        <div className="relative">
          <Input
            type="text"
            id="card-number"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            className="w-full pr-10"
            required
          />
          <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiry" className="block text-sm font-medium text-[#334e68] mb-1">
            Date d'expiration
          </label>
          <Input
            type="text"
            id="expiry"
            value={expiry}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            className="w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="cvc" className="block text-sm font-medium text-[#334e68] mb-1">
            CVC/CVV
          </label>
          <Input
            type="text"
            id="cvc"
            value={cvc}
            onChange={handleCvcChange}
            placeholder="123"
            className="w-full"
            required
          />
        </div>
      </div>
    </form>
  );
};

export default CardPaymentForm;

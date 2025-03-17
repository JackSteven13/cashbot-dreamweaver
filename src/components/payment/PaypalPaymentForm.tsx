
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface PaypalPaymentFormProps {
  onSubmit: (formData: { paypalEmail: string }) => void;
}

const PaypalPaymentForm = ({ onSubmit }: PaypalPaymentFormProps) => {
  const [paypalEmail, setPaypalEmail] = useState('');

  const handleSubmit = () => {
    onSubmit({ paypalEmail });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="paypal-email" className="block text-sm font-medium text-[#334e68] mb-1">
          Adresse e-mail PayPal
        </label>
        <Input
          type="email"
          id="paypal-email"
          value={paypalEmail}
          onChange={(e) => setPaypalEmail(e.target.value)}
          placeholder="email@exemple.com"
          className="w-full"
        />
      </div>
      <p className="text-sm text-[#486581] italic">
        Vous serez redirigé vers PayPal pour terminer votre paiement de manière sécurisée.
      </p>
    </div>
  );
};

export default PaypalPaymentForm;

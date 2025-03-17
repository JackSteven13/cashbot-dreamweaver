
import React from 'react';
import { CreditCard } from 'lucide-react';
import Button from '@/components/Button';
import CardPaymentForm from '@/components/payment/CardPaymentForm';
import { PaymentFormData, PlanType } from '@/hooks/usePaymentProcessing';

interface ManualPaymentFormProps {
  isProcessing: boolean;
  onSubmit: (formData: PaymentFormData) => void;
}

const ManualPaymentForm = ({ isProcessing, onSubmit }: ManualPaymentFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#1e3a5f] mb-2">
        <CreditCard className="h-5 w-5" />
        <h3 className="font-medium">Paiement par carte</h3>
      </div>
      
      <CardPaymentForm onSubmit={onSubmit} />
    
      <Button 
        fullWidth 
        className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
        onClick={() => {
          const formData = document.getElementById('card-payment-form') as HTMLFormElement;
          if (formData) {
            formData.dispatchEvent(new Event('submit', { bubbles: true }));
          }
        }}
        isLoading={isProcessing}
      >
        {isProcessing ? 'Traitement en cours...' : 'Payer maintenant'}
      </Button>
    </div>
  );
};

export default ManualPaymentForm;

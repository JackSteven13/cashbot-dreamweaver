
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { PaymentFormData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePaymentProcessing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const processCardPayment = async (formData: PaymentFormData) => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer un paiement.",
        variant: "destructive"
      });
      navigate('/login');
      return false;
    }

    setIsProcessing(true);

    try {
      // In a real-world scenario, you would:
      // 1. Validate the card data
      // 2. Send it to a payment processor
      // 3. Update the user's subscription in your database
      
      // For demo purposes, we'll simulate a successful payment
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      const expiryDate = formData.expiryDate || formData.expiry || '';
      const cvv = formData.cvv || formData.cvc || '';
      
      // Simple validation
      if (cardNumber.length !== 16 || expiryDate.length !== 5 || cvv.length !== 3) {
        throw new Error("Informations de carte invalides");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update subscription in database
      const { error } = await supabase.rpc('update_user_subscription', {
        user_id: user.id,
        new_subscription: 'starter' // Default to starter plan
      });

      if (error) {
        throw new Error("Erreur lors de la mise à jour de l'abonnement");
      }

      // Success
      toast({
        title: "Paiement accepté",
        description: "Votre abonnement a été activé avec succès.",
        variant: "default"
      });
      
      // Update local storage
      localStorage.setItem('subscription', 'starter');
      
      return true;
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors du traitement du paiement.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processCardPayment
  };
};

export default usePaymentProcessing;

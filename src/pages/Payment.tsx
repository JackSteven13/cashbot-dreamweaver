import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Custom hooks
import { usePaymentProcessing, useStripeCheckout, PaymentFormData, PlanType } from '@/hooks/payment';

// Custom components
import PaymentHeader from '@/components/payment/PaymentHeader';
import PaymentCard from '@/components/payment/PaymentCard';
import SecurityNote from '@/components/payment/SecurityNote';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [useStripePayment, setUseStripePayment] = useState(true);
  
  // Get the processing state from the payment hooks
  const { isProcessing, processPayment } = usePaymentProcessing(selectedPlan);
  const { isStripeProcessing, handleStripeCheckout } = useStripeCheckout(selectedPlan);

  // Get plan from state or URL parameters
  useEffect(() => {
    const plan = location.state?.plan || new URLSearchParams(location.search).get('plan');
    if (plan && ['freemium', 'pro', 'visionnaire', 'alpha'].includes(plan)) {
      setSelectedPlan(plan as PlanType);
    } else {
      // If no valid plan is specified, redirect back to offers
      navigate('/offres');
    }

    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Accès refusé",
            description: "Vous devez être connecté pour souscrire à un abonnement.",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }
        
        setIsAuthChecking(false);
      } catch (error) {
        console.error("Authentication error:", error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier votre session. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [location, navigate]);

  const handleCardFormSubmit = (cardData: PaymentFormData) => {
    processPayment(cardData);
  };

  const togglePaymentMethod = () => {
    setUseStripePayment(!useStripePayment);
  };

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f23]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="cyberpunk-bg min-h-screen">
      <PaymentHeader />
      
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <PaymentCard 
            selectedPlan={selectedPlan}
            useStripeCheckout={useStripePayment}
            isStripeProcessing={isStripeProcessing}
            isProcessing={isProcessing}
            onToggleMethod={togglePaymentMethod}
            onCardFormSubmit={handleCardFormSubmit}
            onStripeCheckout={handleStripeCheckout}
          />
          
          <SecurityNote />
        </div>
      </main>
    </div>
  );
};

export default Payment;

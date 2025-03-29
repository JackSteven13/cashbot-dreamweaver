
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
  const { 
    isStripeProcessing, 
    handleStripeCheckout, 
    stripeCheckoutUrl 
  } = useStripeCheckout(selectedPlan);

  // Get plan from state or URL parameters
  useEffect(() => {
    // Extract plan from state or URL params
    let plan: string | null = null;
    
    if (location.state && location.state.plan) {
      plan = location.state.plan;
      console.log("Plan from state:", plan);
    } else {
      plan = new URLSearchParams(location.search).get('plan');
      console.log("Plan from URL params:", plan);
    }
    
    console.log("Payment page initialized with plan:", plan);
    
    // Redirect freemium users back to dashboard or offers
    if (plan === 'freemium') {
      handleFreemiumSubscription();
      return;
    }
    
    if (plan && ['pro', 'visionnaire', 'alpha'].includes(plan)) {
      setSelectedPlan(plan as PlanType);
    } else {
      // If no valid plan is specified, redirect back to offers
      toast({
        title: "Plan non valide",
        description: "Veuillez sélectionner un plan valide.",
        variant: "destructive"
      });
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

  // Automatically initiate Stripe checkout when the page loads and plan is selected
  useEffect(() => {
    if (selectedPlan && !isAuthChecking && !isStripeProcessing && useStripePayment) {
      console.log("Auto-initiating Stripe checkout for plan:", selectedPlan);
      // Short delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleStripeCheckout();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedPlan, isAuthChecking, isStripeProcessing, useStripePayment, handleStripeCheckout]);

  // Handle freemium subscription
  const handleFreemiumSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Tenter d'abord avec une fonction RPC
        try {
          const { error: rpcError } = await supabase
            .rpc('update_user_subscription', { 
              user_id: session.user.id, 
              new_subscription: 'freemium' 
            }) as { error: any };
            
          if (rpcError) throw rpcError;
          
          console.log("Abonnement mis à jour avec succès via RPC");
        } catch (rpcError) {
          console.error("Erreur RPC:", rpcError);
          
          // Fallback sur méthode directe
          const { error } = await supabase
            .from('user_balances')
            .update({ 
              subscription: 'freemium',
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (error) throw error;
        }
        
        localStorage.setItem('subscription', 'freemium');
        
        toast({
          title: "Abonnement Freemium activé !",
          description: "Vous bénéficiez maintenant des avantages du forfait Freemium.",
        });
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de votre abonnement.",
        variant: "destructive"
      });
      navigate('/offres');
    }
  };

  const handleCardFormSubmit = (cardData: PaymentFormData) => {
    processPayment(cardData);
  };

  const togglePaymentMethod = () => {
    setUseStripePayment(!useStripePayment);
  };

  const initiateStripeCheckout = () => {
    console.log("Initiating Stripe checkout from Payment page");
    try {
      handleStripeCheckout();
    } catch (error) {
      console.error("Error initiating Stripe checkout:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du paiement. Veuillez réessayer.",
        variant: "destructive"
      });
    }
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
            onStripeCheckout={initiateStripeCheckout}
            stripeCheckoutUrl={stripeCheckoutUrl}
          />
          
          <SecurityNote />
        </div>
      </main>
    </div>
  );
};

export default Payment;

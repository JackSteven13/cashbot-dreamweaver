
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/Button';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Custom components
import CardPaymentForm from '@/components/payment/CardPaymentForm';
import PlanSummary from '@/components/payment/PlanSummary';

// Custom hooks
import { usePaymentProcessing, PlanType, PaymentFormData } from '@/hooks/usePaymentProcessing';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [useStripeCheckout, setUseStripeCheckout] = useState(true);
  
  // Create a local state for processing to use with Stripe Checkout
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  
  // Get the processing state from the payment hook
  const { isProcessing, processPayment } = usePaymentProcessing(selectedPlan);

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

  const handleStripeCheckout = async () => {
    if (!selectedPlan || selectedPlan === 'freemium') {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un plan payant",
        variant: "destructive"
      });
      return;
    }

    setIsStripeProcessing(true);

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour effectuer cette action",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      const token = session.access_token;
      const response = await fetch(`${window.location.origin}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/offres`,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // If it's a free plan that was processed on the server
      if (data.free) {
        setIsStripeProcessing(false);
        toast({
          title: "Abonnement activé",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        navigate('/dashboard');
        return;
      }

      // Redirect to Stripe checkout page
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Aucune URL de paiement reçue");
    } catch (error) {
      console.error("Payment error:", error);
      setIsStripeProcessing(false);
      
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.",
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
      <header className="bg-[#1e3a5f] shadow-md p-4">
        <div className="container mx-auto">
          <div className="flex items-center">
            <Link to="/offres" className="text-blue-200 hover:underline flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour aux offres
            </Link>
            <h1 className="text-2xl font-bold text-white ml-4">Paiement</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-xl text-[#1e3a5f]">
                Finaliser votre abonnement {selectedPlan && (selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1))}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PlanSummary selectedPlan={selectedPlan} />
              
              {useStripeCheckout ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-center">
                    <p className="text-[#1e3a5f] mb-2">Vous allez être redirigé vers Stripe pour un paiement sécurisé</p>
                    <p className="text-sm text-[#486581]">Votre abonnement sera activé immédiatement après le paiement</p>
                  </div>
                  
                  <Button 
                    fullWidth 
                    className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
                    onClick={handleStripeCheckout}
                    isLoading={isStripeProcessing}
                  >
                    {isStripeProcessing ? 'Traitement en cours...' : 'Payer avec Stripe'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#1e3a5f] mb-2">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="font-medium">Paiement par carte</h3>
                  </div>
                  
                  <CardPaymentForm onSubmit={handleCardFormSubmit} />
                
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
              )}
            </CardContent>
            <CardFooter className="flex flex-col">
              <div className="w-full flex justify-center">
                <Button 
                  variant="outline" 
                  className="text-[#2d5f8a] border-[#2d5f8a]"
                  onClick={() => setUseStripeCheckout(!useStripeCheckout)}
                >
                  {useStripeCheckout ? 'Utiliser le formulaire classique' : 'Payer avec Stripe'}
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-[#486581]">
              🔒 Paiement sécurisé - Vos données sont chiffrées
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;


import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/Button';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom components
import CardPaymentForm from '@/components/payment/CardPaymentForm';
import PaypalPaymentForm from '@/components/payment/PaypalPaymentForm';
import PaypalLogo from '@/components/payment/PaypalLogo';
import PlanSummary from '@/components/payment/PlanSummary';

// Custom hooks
import { usePaymentProcessing, PlanType, PaymentFormData } from '@/hooks/usePaymentProcessing';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");
  
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

  const handlePayment = async () => {
    const formData: PaymentFormData = {};
    processPayment(paymentMethod, formData);
  };

  const handleCardFormSubmit = (cardData: { cardNumber: string; expiry: string; cvc: string; }) => {
    processPayment('card', cardData);
  };

  const handlePaypalFormSubmit = (paypalData: { paypalEmail: string }) => {
    processPayment('paypal', paypalData);
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
              
              <Tabs defaultValue="card" onValueChange={setPaymentMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="card" className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Carte bancaire
                  </TabsTrigger>
                  <TabsTrigger value="paypal" className="flex items-center gap-2">
                    <PaypalLogo />
                    PayPal
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="space-y-4">
                  <CardPaymentForm onSubmit={handleCardFormSubmit} />
                </TabsContent>
                
                <TabsContent value="paypal" className="space-y-4">
                  <PaypalPaymentForm onSubmit={handlePaypalFormSubmit} />
                </TabsContent>
              </Tabs>
              
            </CardContent>
            <CardFooter>
              <Button 
                fullWidth 
                className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
                onClick={handlePayment}
                isLoading={isProcessing}
              >
                {isProcessing ? 'Traitement en cours...' : `Payer maintenant avec ${paymentMethod === 'card' ? 'carte' : 'PayPal'}`}
              </Button>
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

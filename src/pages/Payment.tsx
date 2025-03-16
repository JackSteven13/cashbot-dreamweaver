
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/Button';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

// Plan prices
const PLAN_PRICES = {
  'freemium': 0,
  'pro': 19.99,
  'visionnaire': 49.99,
  'alpha': 99.99
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Get plan from state or URL parameters
  useEffect(() => {
    const plan = location.state?.plan || new URLSearchParams(location.search).get('plan');
    if (plan && Object.keys(PLAN_PRICES).includes(plan)) {
      setSelectedPlan(plan);
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

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erreur",
        description: "Aucun plan sélectionné",
        variant: "destructive"
      });
      return;
    }

    // Basic form validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      toast({
        title: "Erreur",
        description: "Numéro de carte invalide",
        variant: "destructive"
      });
      return;
    }

    if (!expiry || expiry.length !== 5) {
      toast({
        title: "Erreur",
        description: "Date d'expiration invalide",
        variant: "destructive"
      });
      return;
    }

    if (!cvc || cvc.length !== 3) {
      toast({
        title: "Erreur",
        description: "Code CVC invalide",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

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

      // Update user subscription in Supabase
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          subscription: selectedPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
        
      if (updateError) {
        throw updateError;
      }

      // Simulate payment processing delay
      setTimeout(() => {
        setIsProcessing(false);
        
        toast({
          title: "Paiement réussi",
          description: `Votre abonnement ${selectedPlan} a été activé avec succès !`,
        });
        
        // Redirect to dashboard after successful payment
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      
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
              {selectedPlan && (
                <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[#1e3a5f]">
                        {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                      </p>
                      <p className="text-sm text-[#486581]">
                        Abonnement mensuel
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[#2d5f8a]">
                      {PLAN_PRICES[selectedPlan as keyof typeof PLAN_PRICES]}€/mois
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="card-number" className="block text-sm font-medium text-[#334e68] mb-1">
                    Numéro de carte
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="card-number"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5f8a]"
                    />
                    <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-[#334e68] mb-1">
                      Date d'expiration
                    </label>
                    <input
                      type="text"
                      id="expiry"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5f8a]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-[#334e68] mb-1">
                      CVC/CVV
                    </label>
                    <input
                      type="text"
                      id="cvc"
                      value={cvc}
                      onChange={handleCvcChange}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5f8a]"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                fullWidth 
                className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
                onClick={handlePayment}
                isLoading={isProcessing}
              >
                {isProcessing ? 'Traitement en cours...' : 'Payer maintenant'}
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

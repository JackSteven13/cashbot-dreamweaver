
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/Button';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const updateLocalStorageSubscription = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Attendre un court délai pour s'assurer que le webhook a eu le temps de mettre à jour Supabase
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Récupérer les données de l'utilisateur depuis Supabase en contournant le cache
          const { data: userBalanceData, error } = await supabase
            .from('user_balances')
            .select('subscription')
            .eq('id', session.user.id)
            .single();
          
          if (!error && userBalanceData) {
            // Mettre à jour le localStorage avec le nouvel abonnement
            localStorage.setItem('subscription', userBalanceData.subscription);
            console.log('Subscription updated in localStorage:', userBalanceData.subscription);
            
            // Forcer une actualisation des balances à l'arrivée sur le dashboard
            localStorage.setItem('forceRefreshBalance', 'true');
            
            // Faire une deuxième vérification après un délai pour s'assurer que les données sont à jour
            setTimeout(async () => {
              const { data: refreshedData, error: refreshError } = await supabase
                .from('user_balances')
                .select('subscription')
                .eq('id', session.user.id)
                .single();
                
              if (!refreshError && refreshedData) {
                localStorage.setItem('subscription', refreshedData.subscription);
                console.log('Second check: subscription confirmed as', refreshedData.subscription);
              }
            }, 3000);
          } else {
            console.error('Error fetching subscription:', error);
            
            // Essayer une approche alternative en cas d'erreur
            try {
              const { data: freshData, error: rpcError } = await supabase
                .rpc('get_current_subscription', { user_id: session.user.id });
                
              if (!rpcError && freshData) {
                console.log("Abonnement récupéré via RPC:", freshData);
                localStorage.setItem('subscription', freshData);
              }
            } catch (rpcErr) {
              console.error("Erreur RPC:", rpcErr);
            }
          }
        } else {
          console.error('No session found');
        }
      } catch (error) {
        console.error('Error in updateLocalStorageSubscription:', error);
      }
    };

    // Show success toast
    toast({
      title: "Paiement réussi",
      description: "Votre abonnement a été activé avec succès !",
    });

    // Update localStorage with the new subscription
    updateLocalStorageSubscription();

    // Redirect to dashboard after a delay
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="cyberpunk-bg min-h-screen flex items-center justify-center px-4">
      <Card className="cyber-card max-w-md w-full">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-4">
            Paiement réussi !
          </h1>
          
          <p className="text-[#486581] mb-6">
            Votre abonnement a été activé avec succès. Vous allez être redirigé vers votre tableau de bord dans quelques instants.
          </p>
          
          <Button 
            className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            Accéder au tableau de bord <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;

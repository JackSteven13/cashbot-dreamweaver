
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, RefreshCw, Home, RotateCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/Button';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserDataRefresh } from '@/hooks/session/useUserDataRefresh';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState('checking');
  const { refreshUserData } = useUserDataRefresh();
  
  // More robust function to check and update subscription
  const updateSubscription = useCallback(async () => {
    try {
      setProcessingStatus('checking');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        setProcessingStatus('error');
        toast({
          title: "Erreur d'authentification",
          description: "Vous n'êtes pas connecté. Veuillez vous connecter pour continuer.",
          variant: "destructive"
        });
        return;
      }
      
      // First attempt - normal query
      setProcessingStatus('querying');
      const { data: userBalanceData, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
      
      if (!error && userBalanceData?.subscription) {
        setSubscription(userBalanceData.subscription);
        localStorage.setItem('subscription', userBalanceData.subscription);
        localStorage.setItem('forceRefreshBalance', 'true');
        setProcessingStatus('success');
        
        // Refresh user data in the global state
        await refreshUserData();
        return;
      }

      // Second attempt - RPC function
      setProcessingStatus('rpc_checking');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_current_subscription', { user_id: session.user.id });
      
      if (!rpcError && rpcData) {
        setSubscription(rpcData);
        localStorage.setItem('subscription', rpcData);
        localStorage.setItem('forceRefreshBalance', 'true');
        setProcessingStatus('success');
        
        // Refresh user data in the global state
        await refreshUserData();
        return;
      }
      
      // If both attempts failed
      setProcessingStatus('retrying');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retry with final attempt
      const { data: finalData, error: finalError } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
        
      if (!finalError && finalData?.subscription) {
        setSubscription(finalData.subscription);
        localStorage.setItem('subscription', finalData.subscription);
        setProcessingStatus('success');
        
        // Refresh user data in the global state
        await refreshUserData();
      } else {
        setProcessingStatus('incomplete');
      }
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      setProcessingStatus('error');
    } finally {
      setIsUpdating(false);
    }
  }, [refreshUserData]);

  useEffect(() => {
    // Show success toast
    toast({
      title: "Paiement réussi",
      description: "Votre abonnement est en cours d'activation...",
    });

    // Start the update process
    updateSubscription();
    
    // Set a timer to navigate to dashboard if everything is successful
    const successTimer = setTimeout(() => {
      if (processingStatus === 'success') {
        navigate('/dashboard', { replace: true });
      }
    }, 3000);
    
    // Set a timeout to prevent hanging on the page forever
    const maxWaitTimer = setTimeout(() => {
      if (isUpdating) {
        setIsUpdating(false);
        setProcessingStatus('timeout');
      }
    }, 15000);

    return () => {
      clearTimeout(successTimer);
      clearTimeout(maxWaitTimer);
    };
  }, [navigate, processingStatus, isUpdating, updateSubscription]);

  const handleManualContinue = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsUpdating(true);
    updateSubscription();
  };
  
  const getStatusMessage = () => {
    switch (processingStatus) {
      case 'success':
        return "Votre abonnement a été activé avec succès!";
      case 'checking':
        return "Vérification de votre abonnement...";
      case 'querying':
        return "Récupération des données d'abonnement...";
      case 'rpc_checking':
        return "Vérification avancée de l'abonnement...";
      case 'retrying':
        return "Nouvelle tentative de synchronisation...";
      case 'incomplete':
        return "Synchronisation partielle, certaines données pourraient être manquantes.";
      case 'error':
        return "Une erreur est survenue lors de la synchronisation de votre abonnement.";
      case 'timeout':
        return "Délai d'attente dépassé. Votre abonnement sera synchronisé ultérieurement.";
      default:
        return "Traitement de votre abonnement...";
    }
  };

  return (
    <div className="cyberpunk-bg min-h-screen flex items-center justify-center px-4">
      <Card className="cyber-card max-w-md w-full">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="mb-6 flex justify-center">
            {processingStatus === 'success' ? (
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            ) : processingStatus === 'error' || processingStatus === 'timeout' ? (
              <RotateCw className="h-20 w-20 text-amber-500" />
            ) : (
              <RotateCw className="h-20 w-20 text-blue-500 animate-spin" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-4">
            Paiement réussi !
          </h1>
          
          <p className="text-[#486581] mb-6">
            {subscription ? 
              `Votre abonnement ${subscription.charAt(0).toUpperCase() + subscription.slice(1)} a été activé.` :
              'Votre paiement a été accepté.'
            }
            <br />
            {getStatusMessage()}
          </p>
          
          <div className="space-y-3">
            <Button 
              className="bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white w-full flex items-center justify-center gap-2"
              onClick={handleManualContinue}
            >
              <Home className="w-4 h-4" /> Accéder au tableau de bord
            </Button>
            
            {(retryCount > 0 || processingStatus === 'error' || processingStatus === 'timeout' || processingStatus === 'incomplete') && (
              <Button 
                variant="outline"
                className="w-full border-gray-300 flex items-center justify-center gap-2"
                onClick={handleRetry}
                isLoading={isUpdating}
              >
                <RefreshCw className="w-4 h-4" /> Synchroniser mon abonnement
              </Button>
            )}
          </div>
          
          {(processingStatus === 'error' || processingStatus === 'timeout' || processingStatus === 'incomplete') && (
            <p className="text-sm text-amber-600 mt-4">
              Pas d'inquiétude ! Même si la synchronisation n'est pas immédiate, 
              votre abonnement sera activé automatiquement lors de votre prochaine 
              connexion.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;

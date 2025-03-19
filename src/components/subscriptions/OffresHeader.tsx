
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SubscriptionStatusIndicator from '@/components/subscriptions/SubscriptionStatusIndicator';
import SubscriptionSynchronizer from './SubscriptionSynchronizer';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface OffresHeaderProps {
  isLoading: boolean;
  currentSubscription: string | null;
}

const OffresHeader: React.FC<OffresHeaderProps> = ({ 
  isLoading, 
  currentSubscription 
}) => {
  const navigate = useNavigate();
  const [syncedSubscription, setSyncedSubscription] = useState<string | null>(currentSubscription);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (currentSubscription !== syncedSubscription && currentSubscription !== null) {
      setSyncedSubscription(currentSubscription);
    }
  }, [currentSubscription]);

  const handleSync = (subscription: string) => {
    console.log("Synchronisation reçue:", subscription);
    setSyncedSubscription(subscription);
  };
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      toast({
        title: "Rafraîchissement en cours",
        description: "Vérification de l'état de votre abonnement...",
      });
      
      // Force une vérification directe avec Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Vider le cache Supabase pour cette requête
        const { data, error } = await supabase
          .rpc('get_current_subscription', { 
            user_id: session.user.id 
          }, { 
            head: false, // Désactiver le cache
            count: 'exact' as const
          }) as { data: string | null, error: any };
          
        if (!error && data) {
          setSyncedSubscription(data);
          localStorage.setItem('subscription', data);
          toast({
            title: "Abonnement rafraîchi",
            description: `Votre abonnement actuel est: ${data.charAt(0).toUpperCase() + data.slice(1)}`,
          });
          console.log("Abonnement rafraîchi manuellement:", data);
          
          // Forcer un rafraîchissement de la page après une courte pause
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
        } else {
          console.error("Erreur lors du rafraîchissement manuel:", error);
          toast({
            title: "Erreur de synchronisation",
            description: "Impossible de récupérer votre abonnement. Veuillez réessayer.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement manuel:", error);
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de la vérification de votre abonnement.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 mb-12">
      {/* Synchroniseur invisible pour assurer des données à jour */}
      <SubscriptionSynchronizer onSync={handleSync} forceCheck={true} />
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">
          Nos offres
        </h1>
        <p className="text-lg text-blue-100 max-w-2xl">
          Choisissez l'offre qui correspond le mieux à vos besoins et maximisez vos revenus.
        </p>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retour au Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            disabled={isRefreshing}
            className="border-blue-400/30 text-blue-300 hover:text-blue-200 hover:bg-blue-800/30"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Rafraîchir l'abonnement
          </Button>
        </div>
      </div>
      
      <SubscriptionStatusIndicator 
        isLoading={isLoading || isRefreshing} 
        currentSubscription={syncedSubscription} 
      />
    </div>
  );
};

export default OffresHeader;

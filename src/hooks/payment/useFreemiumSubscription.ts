
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { updateLocalSubscription } from './utils';

/**
 * Handles activating the freemium subscription
 */
export const useFreemiumSubscription = () => {
  const navigate = useNavigate();
  
  const activateFreemiumSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour effectuer cette action",
          variant: "destructive"
        });
        navigate('/login');
        return false;
      }
      
      // Mise à jour via RPC
      try {
        const { error: rpcError } = await supabase
          .rpc('update_user_subscription', { 
            user_id: session.user.id, 
            new_subscription: 'freemium' 
          }) as { error: any };
          
        if (!rpcError) {
          console.log("Abonnement mis à jour avec succès via RPC");
        } else {
          // Si l'appel RPC échoue, essayer la méthode directe
          const { error } = await supabase
            .from('user_balances')
            .update({ 
              subscription: 'freemium',
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (error) throw error;
        }
      } catch (error) {
        console.error("Error updating subscription:", error);
        
        // Dernière tentative - méthode directe
        const { error: directError } = await supabase
          .from('user_balances')
          .update({ 
            subscription: 'freemium',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
          
        if (directError) throw directError;
      }
      
      // Mettre à jour localStorage immédiatement
      await updateLocalSubscription('freemium');
      
      // Forcer le rafraîchissement des données au retour sur le dashboard
      localStorage.setItem('forceRefreshBalance', 'true');
      
      toast({
        title: "Abonnement Freemium activé",
        description: "Votre abonnement Freemium a été activé avec succès !",
      });
      
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error("Error activating freemium subscription:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'activation de votre abonnement.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  return { activateFreemiumSubscription };
};

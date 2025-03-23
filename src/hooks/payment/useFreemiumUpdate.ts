
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { updateLocalSubscription } from './utils';

/**
 * Hook for handling freemium subscription updates
 */
export const useFreemiumUpdate = () => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const updateToFreemium = async () => {
    setIsUpdating(true);
    
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
      
      // Try with RPC first
      try {
        const { error: rpcError } = await supabase
          .rpc('update_user_subscription', { 
            user_id: session.user.id, 
            new_subscription: 'freemium' 
          }) as { error: any };
          
        if (rpcError) throw rpcError;
        
        console.log("Subscription updated successfully via RPC");
      } catch (rpcCatchError) {
        console.error("RPC Error:", rpcCatchError);
        
        // Fallback to direct update
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ 
            subscription: 'freemium',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
          
        if (updateError) throw updateError;
      }
      
      // Update localStorage immediately
      await updateLocalSubscription('freemium');
      
      // Force refresh of data when returning to dashboard
      localStorage.setItem('forceRefreshBalance', 'true');
      
      toast({
        title: "Abonnement Freemium activé",
        description: "Votre abonnement Freemium a été activé avec succès !",
      });
      
      setIsUpdating(false);
      return true;
    } catch (error) {
      console.error("Error updating subscription:", error);
      setIsUpdating(false);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'activation de votre abonnement.",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  return {
    isUpdating,
    updateToFreemium
  };
};

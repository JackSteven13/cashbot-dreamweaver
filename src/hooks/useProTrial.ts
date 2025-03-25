
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

interface UseProTrialResult {
  isPromoActivated: boolean;
  tempProEnabled: boolean;
  activateProTrial: (subscription: string) => Promise<void>;
}

export const useProTrial = (subscription: string): UseProTrialResult => {
  const [isPromoActivated, setIsPromoActivated] = useState(false);
  const [tempProEnabled, setTempProEnabled] = useState(false);
  
  useEffect(() => {
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        setTempProEnabled(true);
        setIsPromoActivated(true);
      } else {
        localStorage.setItem('proTrialUsed', 'true');
        localStorage.removeItem('proTrialActive');
        localStorage.removeItem('proTrialExpires');
        localStorage.removeItem('proTrialActivatedAt');
      }
    }
  }, [subscription]);
  
  const activateProTrial = async (currentSubscription: string) => {
    if (currentSubscription === 'freemium' && !isPromoActivated) {
      try {
        if (localStorage.getItem('proTrialUsed') === 'true') {
          toast({
            title: "Offre déjà utilisée",
            description: "Vous avez déjà profité de l'offre d'essai Pro gratuite.",
            variant: "destructive"
          });
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase
            .from('user_balances')
            .select('id, pro_trial_used')
            .eq('id', session.user.id)
            .single();
            
          if (!error && data && data.pro_trial_used) {
            localStorage.setItem('proTrialUsed', 'true');
            toast({
              title: "Offre déjà utilisée",
              description: "Vous avez déjà profité de l'offre d'essai Pro gratuite.",
              variant: "destructive"
            });
            return;
          }
          
          const now = Date.now();
          const expiryTime = now + (48 * 60 * 60 * 1000);
          
          console.log(`Activation de l'essai Pro: ${new Date(now).toLocaleString()} jusqu'à ${new Date(expiryTime).toLocaleString()}`);
          
          localStorage.setItem('proTrialActive', 'true');
          localStorage.setItem('proTrialExpires', expiryTime.toString());
          localStorage.setItem('proTrialActivatedAt', now.toString());
          localStorage.setItem('proTrialUsed', 'true');
          
          const { error: updateError } = await supabase
            .from('user_balances')
            .update({ 
              pro_trial_used: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
            
          if (updateError) {
            console.error("Erreur lors de la mise à jour du statut de l'essai Pro:", updateError);
          }
          
          setTempProEnabled(true);
          setIsPromoActivated(true);
          
          localStorage.setItem('tempProDisplay', 'true');
          
          toast({
            title: "Offre activée !",
            description: "Votre période d'essai Pro de 48h est maintenant active.",
          });
          
          window.location.reload();
        }
      } catch (error) {
        console.error("Erreur lors de l'activation de l'essai Pro:", error);
        toast({
          title: "Erreur d'activation",
          description: "Une erreur est survenue lors de l'activation de l'offre. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    }
  };

  return {
    isPromoActivated,
    tempProEnabled,
    activateProTrial
  };
};

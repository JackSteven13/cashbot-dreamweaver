
import React, { useState, useEffect } from 'react';
import { FeedbackDialog } from './FeedbackDialog';
import { SystemInfo, SystemInfoGrid } from './SystemInfo';
import { ProTrialBanner, ProTrialActive } from './ProTrialBanner';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { supabase } from '@/integrations/supabase/client';
import { getEffectiveSubscription, SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';
import { toast } from "@/components/ui/use-toast";

interface SystemTerminalProps {
  isNewUser: boolean;
  dailyLimit: number;
  subscription: string;
  remainingSessions: number | string;
  referralCount: number;
  displayBalance: number;
  referralBonus?: number;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser,
  dailyLimit,
  subscription,
  remainingSessions,
  referralCount,
  displayBalance,
  referralBonus = 0
}) => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showProTrialInfo, setShowProTrialInfo] = useState(isNewUser);
  const [isPromoActivated, setIsPromoActivated] = useState(false);
  const [tempProEnabled, setTempProEnabled] = useState(false);
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  const limitPercentage = Math.min(100, (displayBalance / effectiveLimit) * 100);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);
    
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
    
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
  
  const activateProTrial = async () => {
    if (subscription === 'freemium' && !isPromoActivated) {
      try {
        // Vérifier d'abord si l'utilisateur a déjà utilisé l'offre
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
          // Vérification côté serveur si l'essai a déjà été utilisé
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
          
          // Si l'utilisateur n'a pas encore utilisé l'offre, l'activer
          const now = Date.now();
          const expiryTime = now + (48 * 60 * 60 * 1000);
          
          console.log(`Activation de l'essai Pro: ${new Date(now).toLocaleString()} jusqu'à ${new Date(expiryTime).toLocaleString()}`);
          
          // Mise à jour des données locales
          localStorage.setItem('proTrialActive', 'true');
          localStorage.setItem('proTrialExpires', expiryTime.toString());
          localStorage.setItem('proTrialActivatedAt', now.toString());
          localStorage.setItem('proTrialUsed', 'true');
          
          // Mise à jour dans la base de données
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

  return (
    <div className="w-full lg:w-1/2">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg border border-slate-700 p-5 text-white">
        <SystemInfo 
          isNewUser={isNewUser} 
          onFeedbackClick={() => setShowFeedbackDialog(true)} 
        />
        
        <SystemProgressBar 
          displayBalance={displayBalance} 
          dailyLimit={effectiveLimit} 
          limitPercentage={limitPercentage}
          subscription={subscription}
        />
        
        {isCountingDown && (
          <SessionCountdown timeRemaining={timeRemaining} />
        )}
        
        <SystemInfoGrid 
          subscription={subscription}
          tempProEnabled={tempProEnabled}
          dailyLimit={effectiveLimit}
          remainingSessions={remainingSessions}
          referralBonus={referralBonus}
        />
        
        {isNewUser && <NewUserGuide />}
        
        {subscription === 'freemium' && !isPromoActivated && (
          <ProTrialBanner onClick={activateProTrial} />
        )}
        
        {isPromoActivated && <ProTrialActive />}
      </div>
      
      <FeedbackDialog
        open={showFeedbackDialog}
        feedback={feedback}
        setFeedback={setFeedback}
        onClose={() => setShowFeedbackDialog(false)}
        onSubmit={() => {
          if (feedback.trim()) {
            setFeedback('');
            setShowFeedbackDialog(false);
          }
        }}
      />
    </div>
  );
};

export default SystemTerminal;


import React, { useState, useEffect } from 'react';
import { FeedbackDialog } from './FeedbackDialog';
import { SystemInfo, SystemInfoGrid } from './SystemInfo';
import { ProTrialBanner } from './ProTrialBanner';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Utiliser notre hook pour le compte à rebours
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  // Calculer le pourcentage de progression vers la limite journalière
  const limitPercentage = Math.min(100, (displayBalance / dailyLimit) * 100);
  
  useEffect(() => {
    // Vérifier si le mode Pro temporaire est activé dans le localStorage
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        setTempProEnabled(true);
        setIsPromoActivated(true);
      } else {
        // Si expiré, supprimer du localStorage
        localStorage.removeItem('proTrialActive');
        localStorage.removeItem('proTrialExpires');
      }
    }
  }, []);
  
  const activateProTrial = async () => {
    if (subscription === 'freemium' && !isPromoActivated) {
      // Définir l'expiration à 48h à partir de maintenant
      const expiryTime = Date.now() + (48 * 60 * 60 * 1000);
      
      // Stocker dans localStorage
      localStorage.setItem('proTrialActive', 'true');
      localStorage.setItem('proTrialExpires', expiryTime.toString());
      
      // Mettre à jour l'état
      setTempProEnabled(true);
      setIsPromoActivated(true);
      
      // Session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Mise à jour temporaire de la base de données pour indiquer l'essai pro
        // Note: Ceci n'est pas persistant, c'est juste visuel pour l'interface
        localStorage.setItem('tempProDisplay', 'true');
      }
      
      window.location.reload(); // Rafraîchir pour appliquer immédiatement les changements
    }
  };

  return (
    <div className="w-full h-full">
      <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl shadow-xl border border-indigo-700/50 p-6 text-white overflow-hidden relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjEuOSAyLjEgMi4xdjI3LjhjMCAxLjItLjkgMi4xLTIuMSAyLjFIOFYxOGgyOHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        {/* Header with system status and feedback button */}
        <SystemInfo 
          isNewUser={isNewUser} 
          onFeedbackClick={() => setShowFeedbackDialog(true)} 
        />
        
        {/* Progress bar for daily limit */}
        <SystemProgressBar 
          displayBalance={displayBalance} 
          dailyLimit={dailyLimit} 
          limitPercentage={limitPercentage} 
        />
        
        {/* Countdown timer if applicable */}
        {isCountingDown && (
          <SessionCountdown timeRemaining={timeRemaining} />
        )}
        
        {/* System information grid */}
        <SystemInfoGrid 
          subscription={subscription}
          tempProEnabled={tempProEnabled}
          dailyLimit={dailyLimit}
          remainingSessions={remainingSessions}
          referralBonus={referralBonus}
        />
        
        {/* New user guide */}
        {isNewUser && <NewUserGuide />}
        
        {/* Pro trial activation banner */}
        {subscription === 'freemium' && !isPromoActivated && (
          <ProTrialBanner onClick={activateProTrial} />
        )}
      </div>
      
      {/* Feedback dialog */}
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

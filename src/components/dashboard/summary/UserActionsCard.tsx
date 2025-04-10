
import React from 'react';
import ActionButtons from './ActionButtons';
import ReferralLink from './ReferralLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';

interface UserActionsCardProps {
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  referralLink: string;
  referralCount: number;
  isNewUser?: boolean;
  dailySessionCount: number | string;  // Allow both types
  subscription: string;
  canStartSession?: boolean;
  lastSessionTimestamp?: string;
  balance: number;
}

const UserActionsCard: React.FC<UserActionsCardProps> = ({
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  referralLink,
  referralCount,
  isNewUser = false,
  dailySessionCount = 0,
  subscription,
  canStartSession = true,
  lastSessionTimestamp,
  balance
}) => {
  // Obtenir la limite quotidienne selon l'abonnement
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Convert dailySessionCount to number if it's a string
  const numericDailySessionCount = typeof dailySessionCount === 'string' 
    ? parseInt(dailySessionCount, 10) 
    : dailySessionCount;
  
  // Calculer les sessions restantes selon l'abonnement
  const remainingSessions = subscription !== 'freemium' ? 'illimitées' : Math.max(0, 1 - numericDailySessionCount);
  
  // Afficher un message différent selon que l'utilisateur est nouveau ou non
  const welcomeMessage = isNewUser 
    ? "Bienvenue ! Commencez à générer des revenus dès maintenant."
    : "Générez des gains supplémentaires dès maintenant.";
  
  return (
    <Card className="h-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl text-blue-800 dark:text-blue-300">
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {welcomeMessage}
        </p>
        
        <ActionButtons
          isStartingSession={isStartingSession}
          isButtonDisabled={!canStartSession}
          isWithdrawing={false}
          subscription={subscription}
          effectiveSubscription={subscription}
          dailyLimit={dailyLimit}
          canStartSession={canStartSession}
          onBoostClick={handleStartSession}
          onWithdraw={handleWithdrawal || (() => {})}
          remainingSessions={remainingSessions}
          lastSessionTimestamp={lastSessionTimestamp}
          currentBalance={balance}
          isBotActive={true}
        />
        
        <div className="mt-4">
          <ReferralLink 
            referralLink={referralLink} 
            referralCount={referralCount}
            subscription={subscription}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserActionsCard;

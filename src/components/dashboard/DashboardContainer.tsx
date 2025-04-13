
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/userData/useUserData';
import { useBotActivation } from '@/hooks/bot/useBotActivation';
import DashboardHeader from './DashboardHeader';
import DashboardMetrics from './DashboardMetrics';
import BotControlPanel from './bot/BotControlPanel';
import SystemTerminal from './terminal/SystemTerminal';
import DashboardSkeleton from './DashboardSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardContainer = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    userData, 
    isNewUser, 
    dailySessionCount, 
    showLimitAlert,
    isLoading: dataLoading,
    updateBalance,
    refreshUserData
  } = useUserData();
  
  const { isBotActive, setIsBotActive } = useBotActivation();
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Handle start session
  const handleStartSession = () => {
    setIsStartingSession(true);
    
    // Simulate session start
    setTimeout(() => {
      setIsStartingSession(false);
      
      // Refresh user data after session starts
      refreshUserData();
    }, 2000);
  };

  // Handle withdrawal
  const handleWithdrawal = () => {
    // Implement withdrawal logic
    console.log('Processing withdrawal...');
  };

  // Show loading state
  if (authLoading || dataLoading || !userData) {
    return <DashboardSkeleton />;
  }

  // Calculate daily limit progress (for freemium accounts)
  const dailyLimit = userData?.subscription === 'freemium' ? 0.5 : 
                     userData?.subscription === 'starter' ? 2 : 
                     userData?.subscription === 'premium' ? 5 : 10;
  
  const dailyGains = userData?.transactions?.filter(tx => 
    tx.date && tx.date.startsWith(new Date().toISOString().split('T')[0])
  ).reduce((sum, tx) => sum + (tx.gain || 0), 0) || 0;
  
  const dailyLimitProgress = dailyLimit > 0 ? Math.min(100, (dailyGains / dailyLimit) * 100) : 0;
  const limitReached = dailyGains >= dailyLimit;

  return (
    <div className="py-6 px-4 md:px-6 space-y-6">
      <DashboardHeader 
        username={userData?.username || 'Utilisateur'} 
        subscription={userData?.subscription}
      />
      
      <BotControlPanel
        isBotActive={isBotActive}
        showLimitReached={limitReached}
        subscription={userData?.subscription}
        userId={user?.id}
      />
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="terminal">Terminal système</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <DashboardMetrics
            balance={userData?.balance || 0}
            referralLink={userData?.referralLink || ''}
            isStartingSession={isStartingSession}
            handleStartSession={handleStartSession}
            handleWithdrawal={handleWithdrawal}
            transactions={userData?.transactions || []}
            isNewUser={isNewUser}
            subscription={userData?.subscription || 'freemium'}
            dailySessionCount={dailySessionCount || 0}
            canStartSession={!isStartingSession && !limitReached}
            referrals={userData?.referrals || []}
            isBotActive={isBotActive}
          />
        </TabsContent>
        
        <TabsContent value="terminal">
          <SystemTerminal
            isNewUser={isNewUser}
            dailyLimit={dailyLimit}
            subscription={userData?.subscription}
            remainingSessions={0}
            referralCount={userData?.referrals?.length || 0}
            displayBalance={userData?.balance || 0}
            referralBonus={0}
            isBotActive={isBotActive}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardContainer;

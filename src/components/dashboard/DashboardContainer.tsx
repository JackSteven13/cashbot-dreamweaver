
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/userData/useUserData';
import { useBotActivation } from '@/hooks/bot/useBotActivation';
import DashboardHeader from './DashboardHeader';
import DashboardMetrics from './DashboardMetrics';
import BotControlPanel from './bot/BotControlPanel';
import SystemTerminal from './terminal/SystemTerminal';
import DashboardSkeleton from './DashboardSkeleton';
import UserDataStateTracker from './UserDataStateTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardInitializationEffect from './DashboardInitializationEffect';

const DashboardContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const initialRenderComplete = useRef(false);
  const [username, setUsername] = useState<string | null>(null);
  
  const { 
    userData, 
    isNewUser, 
    dailySessionCount, 
    showLimitAlert,
    isLoading,
    fetchUserData,
    setShowLimitAlert
  } = useUserData();
  
  const { isBotActive, activateBot, deactivateBot } = useBotActivation({
    userData,
    isNewUser,
    onActivate: () => console.log("Bot activé")
  });
  
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  
  // Effet pour initialiser une seule fois
  useEffect(() => {
    if (!initialRenderComplete.current) {
      console.log("Initialisation du dashboard...");
      initialRenderComplete.current = true;
    }
  }, []);

  // Effet pour charger les données utilisateur
  useEffect(() => {
    if (user && !userData && !isLoading) {
      console.log("Chargement des données utilisateur");
      fetchUserData();
    }
  }, [user, userData, isLoading, fetchUserData]);

  // Gestionnaire pour le nom d'utilisateur chargé
  const handleUsernameLoaded = (name: string) => {
    console.log("Nom d'utilisateur chargé:", name);
    setUsername(name);
  };
  
  // Gestionnaire pour les données utilisateur rafraîchies
  const handleDataRefreshed = (data: any) => {
    console.log("Données utilisateur rafraîchies:", data);
    // Recharger les données complètes
    if (!isLoading) {
      fetchUserData();
    }
  };

  if (authLoading || (!userData && isLoading)) {
    return <DashboardSkeleton username={username} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader 
        username={username || userData?.username || 'Utilisateur'} 
        isNewUser={isNewUser}
      />
      
      <main className="container mx-auto px-4 py-6">
        <Tabs 
          defaultValue="dashboard" 
          value={selectedNavItem} 
          onValueChange={setSelectedNavItem}
          className="w-full"
        >
          <TabsList className="mb-6 bg-white dark:bg-gray-800 p-1 rounded-md border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="bot">Bot</TabsTrigger>
            <TabsTrigger value="terminal">Terminal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardMetrics
              balance={userData?.balance || 0}
              username={userData?.username || username || 'Utilisateur'}
              subscription={userData?.subscription || 'freemium'}
              isNewUser={isNewUser}
              dailySessionCount={dailySessionCount}
              showLimitAlert={showLimitAlert}
              setShowLimitAlert={setShowLimitAlert}
              referralCount={userData?.referrals?.length || 0}
              referrals={userData?.referrals || []}
            />
          </TabsContent>
          
          <TabsContent value="bot">
            <BotControlPanel 
              isActive={isBotActive}
              onActivate={activateBot}
              onDeactivate={deactivateBot}
              username={userData?.username || username || 'Utilisateur'}
              subscription={userData?.subscription || 'freemium'}
            />
          </TabsContent>
          
          <TabsContent value="terminal">
            <SystemTerminal />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Composants invisibles pour gérer l'état */}
      <UserDataStateTracker 
        onUsernameLoaded={handleUsernameLoaded}
        onDataRefreshed={handleDataRefreshed}
      />
      
      <DashboardInitializationEffect
        initialRenderComplete={initialRenderComplete}
        isAuthChecking={authLoading}
        isLoading={isLoading}
        userData={userData}
        pathname={location.pathname}
        setSelectedNavItem={setSelectedNavItem}
      />
    </div>
  );
};

export default DashboardContainer;

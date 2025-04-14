
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/userData/useUserData';
import DashboardHeader from './DashboardHeader';
import DashboardMetrics from './DashboardMetrics';
import DashboardSkeleton from './DashboardSkeleton';
import UserDataStateTracker from './UserDataStateTracker';

const DashboardContainer = () => {
  const { user, isLoading: authLoading } = useAuth();
  const initialRenderComplete = useRef(false);
  const [username, setUsername] = useState<string | null>(null);
  
  const { 
    userData, 
    isNewUser, 
    dailySessionCount, 
    showLimitAlert,
    isLoading,
    refreshUserData,
    setShowLimitAlert
  } = useUserData();
  
  // État local pour le contrôle du bot
  const [isBotActive, setIsBotActive] = useState(true);
  
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
      refreshUserData(); 
    }
  }, [user, userData, isLoading, refreshUserData]);

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
      refreshUserData();
    }
  };

  if (authLoading || (!userData && isLoading)) {
    return <DashboardSkeleton username={username || 'Utilisateur'} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader 
        username={username || userData?.username || 'Utilisateur'} 
        isNewUser={isNewUser || false}
      />
      
      <main className="container mx-auto px-4 py-6">
        <DashboardMetrics
          balance={userData?.balance || 0}
          referralLink={userData?.referralLink || ''}
          isStartingSession={false}
          handleStartSession={() => {}}
          transactions={userData?.transactions || []}
          subscription={userData?.subscription || 'freemium'}
          isNewUser={isNewUser}
          dailySessionCount={dailySessionCount}
          canStartSession={true}
          referrals={userData?.referrals || []}
          isBotActive={isBotActive}
        />
      </main>
      
      {/* Composant invisible pour gérer l'état */}
      <UserDataStateTracker 
        onUsernameLoaded={handleUsernameLoaded}
        onDataRefreshed={handleDataRefreshed}
      />
    </div>
  );
};

export default DashboardContainer;

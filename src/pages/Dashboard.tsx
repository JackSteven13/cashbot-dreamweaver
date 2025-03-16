
import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { canStartManualSession, SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  // Check authentication before loading data
  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to login");
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à votre tableau de bord.",
          variant: "destructive"
        });
        navigate('/login');
        return false;
      }
      
      console.log("Active session found for user:", session.user.id);
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier votre session. Veuillez vous reconnecter.",
        variant: "destructive"
      });
      navigate('/login');
      return false;
    }
  }, [navigate]);
  
  useEffect(() => {
    // Eviter les initialisations multiples et les race conditions
    let isMounted = true;
    
    const initDashboard = async () => {
      setIsAuthChecking(true);
      const isAuthenticated = await checkAuth();
      
      if (isMounted && isAuthenticated) {
        console.log("User authenticated, initializing dashboard");
        setIsAuthChecking(false);
        // Donner un petit délai pour que tout s'initialise correctement
        setTimeout(() => {
          if (isMounted) {
            console.log("Dashboard ready");
            setIsReady(true);
          }
        }, 300);
      }
    };
    
    console.log("Dashboard component mounted");
    initDashboard();
    
    return () => { 
      console.log("Dashboard component unmounting");
      isMounted = false; 
    };
  }, [checkAuth]);
  
  // Get user data and session management functions from custom hooks
  // N'initialiser les hooks que lorsque l'authentification est vérifiée
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading,
    refreshUserData
  } = useUserData();
  
  // Session management logic
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    isProcessingWithdrawal
  } = useDashboardSessions(
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  );

  // Show a loader while checking auth and loading data
  if (isAuthChecking || isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f23]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-400 sr-only">Chargement...</span>
      </div>
    );
  }

  // Safety check for userData
  if (!userData || !userData.username) {
    console.error("userData or username is missing:", userData);
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f23] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
        <div className="text-center">
          <p className="mb-2">Chargement des données utilisateur...</p>
          <p className="text-sm text-blue-300">Si cette page persiste, veuillez vous reconnecter.</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Retourner à la page de connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      {showLimitAlert && userData.subscription === 'freemium' && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Limite journalière atteinte</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Vous avez atteint votre limite de gain journalier de {SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS]}€ avec votre compte Freemium. 
            <br />Passez à un forfait supérieur pour augmenter vos gains ou revenez demain.
          </AlertDescription>
        </Alert>
      )}
      
      <DashboardMetrics
        balance={userData.balance}
        referralLink={userData.referralLink}
        isStartingSession={isStartingSession}
        handleStartSession={handleStartSession}
        handleWithdrawal={handleWithdrawal}
        transactions={userData.transactions}
        isNewUser={isNewUser}
        subscription={userData.subscription}
        dailySessionCount={dailySessionCount}
        canStartSession={canStartManualSession(userData.subscription, dailySessionCount, userData.balance)}
        referrals={userData.referrals}
      />
    </DashboardLayout>
  );
};

export default Dashboard;


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
  const [authError, setAuthError] = useState(false);
  
  // Amélioré pour être plus robuste
  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to login");
        setAuthError(true);
        return false;
      }
      
      // Vérifier si la session a expiré
      const tokenExpiry = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (now > tokenExpiry) {
        console.log("Session expired, redirecting to login");
        toast({
          title: "Session expirée",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        setAuthError(true);
        return false;
      }
      
      console.log("Active session found for user:", session.user.id);
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(true);
      return false;
    }
  }, [navigate]);
  
  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;
    
    const initDashboard = async () => {
      setIsAuthChecking(true);
      try {
        const isAuthenticated = await checkAuth();
        
        if (!isMounted) return;
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          setIsAuthChecking(false);
          
          // Délai court pour éviter les problèmes de rendu
          initTimeout = setTimeout(() => {
            if (isMounted) {
              console.log("Dashboard ready");
              setIsReady(true);
            }
          }, 300);
        } else {
          // Redirection vers la page de login avec un délai pour éviter les problèmes
          console.log("Authentication failed, redirecting to login");
          setTimeout(() => {
            if (isMounted) {
              navigate('/login');
            }
          }, 300);
        }
      } catch (err) {
        console.error("Error during dashboard initialization:", err);
        if (isMounted) {
          setAuthError(true);
          setIsAuthChecking(false);
        }
      }
    };
    
    console.log("Dashboard component mounted");
    initDashboard();
    
    return () => { 
      console.log("Dashboard component unmounting");
      isMounted = false; 
      clearTimeout(initTimeout);
    };
  }, [checkAuth, navigate]);
  
  // Délai d'initialisation des hooks pour éviter les problèmes
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

  // Afficher un loader plus robuste pendant le chargement
  if (isAuthChecking || isLoading || !isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
        <div className="text-center">
          <p className="text-blue-300 mb-2">Chargement de votre tableau de bord...</p>
          <p className="text-xs text-blue-200">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  // Afficher une page d'erreur si l'authentification échoue
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">Problème d'authentification</h2>
          <p className="mb-6">Nous n'arrivons pas à vérifier votre session.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Retourner à la page de connexion
          </button>
        </div>
      </div>
    );
  }

  // Vérification supplémentaire pour userData
  if (!userData || !userData.username) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white">
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

  // Enfin, afficher le tableau de bord
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

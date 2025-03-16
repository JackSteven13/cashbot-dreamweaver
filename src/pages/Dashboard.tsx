
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { verifyAuth, refreshSession } from "@/utils/auth/index";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);
  
  // Amélioré pour être plus robuste
  const checkAuth = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log("Auth check already in progress, skipping");
      return false;
    }
    
    try {
      authCheckInProgress.current = true;
      
      // Essayer de rafraîchir la session avant tout
      await refreshSession();
      
      // Petit délai pour permettre au rafraîchissement de se propager
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isAuthenticated = await verifyAuth();
      
      authCheckInProgress.current = false;
      
      if (!isAuthenticated) {
        console.log("No active session found, redirecting to login");
        setAuthError(true);
        return false;
      }
      
      console.log("Active session found, initializing dashboard");
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(true);
      authCheckInProgress.current = false;
      return false;
    }
  }, []);
  
  useEffect(() => {
    mountedRef.current = true;
    
    const initDashboard = async () => {
      setIsAuthChecking(true);
      try {
        const isAuthenticated = await checkAuth();
        
        if (!mountedRef.current) return;
        
        if (isAuthenticated) {
          console.log("User authenticated, initializing dashboard");
          setIsAuthChecking(false);
          
          // Délai court pour éviter les problèmes de rendu
          initTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("Dashboard ready");
              setIsReady(true);
            }
          }, 500);
        } else {
          // Redirection vers la page de login avec un délai pour éviter les problèmes
          console.log("Authentication failed, redirecting to login");
          if (mountedRef.current) {
            setTimeout(() => {
              if (mountedRef.current) {
                navigate('/login', { replace: true });
              }
            }, 400);
          }
        }
      } catch (err) {
        console.error("Error during dashboard initialization:", err);
        if (mountedRef.current) {
          setAuthError(true);
          setIsAuthChecking(false);
        }
      }
    };
    
    console.log("Dashboard component mounted");
    // Démarrer avec un léger délai pour éviter les conflits d'initialisation
    setTimeout(() => {
      if (mountedRef.current) {
        initDashboard();
      }
    }, 300);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_OUT') {
        console.log("Auth state change: signed out");
        navigate('/login', { replace: true });
      }
    });
    
    return () => { 
      console.log("Dashboard component unmounting");
      mountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [checkAuth, navigate]);
  
  // Hook d'initialisation des hooks pour éviter les problèmes
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
            onClick={() => navigate('/login', { replace: true })}
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
          <button 
            onClick={() => refreshUserData ? refreshUserData() : null}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Rafraîchir les données
          </button>
          <button 
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 ml-2 px-4 py-2 bg-transparent border border-blue-600 rounded hover:bg-blue-900/20 transition-colors"
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

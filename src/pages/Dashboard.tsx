
import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Vérifier l'authentification avant de charger les données
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Accès refusé",
            description: "Vous devez être connecté pour accéder à votre tableau de bord.",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }
        
        setIsAuthChecking(false);
      } catch (error) {
        console.error("Erreur de vérification d'authentification:", error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier votre session. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Get user data and session management functions from custom hooks
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading
  } = useUserData();
  
  // Session management logic
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal
  } = useDashboardSessions(
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert,
    resetBalance
  );

  // Afficher un loader pendant le chargement des données
  if (isAuthChecking || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f23]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!userData.username) {
    navigate('/login');
    return null;
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

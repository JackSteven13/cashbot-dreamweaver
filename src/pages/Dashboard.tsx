
import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { useUserData } from '@/hooks/useUserData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { canStartManualSession, SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';
import { Loader2 } from 'lucide-react';

interface DashboardProps {
  initialNavItem?: string;
}

const Dashboard = ({ initialNavItem = 'dashboard' }: DashboardProps) => {
  const [selectedNavItem, setSelectedNavItem] = useState(initialNavItem);
  
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

  // Use effect to update selectedNavItem when initialNavItem changes
  useEffect(() => {
    if (initialNavItem) {
      setSelectedNavItem(initialNavItem);
    }
  }, [initialNavItem]);

  // Afficher un loader pendant le chargement des données
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f23]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  // Render different content based on selectedNavItem
  const renderContent = () => {
    switch (selectedNavItem) {
      case 'dashboard':
        return (
          <>
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
            />
          </>
        );
      case 'transactions':
        return (
          <div className="p-6 bg-[#162032] rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Historique des transactions</h2>
            {userData.transactions && userData.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-blue-800">
                      <th className="py-3 text-left">Date</th>
                      <th className="py-3 text-left">Gains</th>
                      <th className="py-3 text-left">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.transactions.map((transaction, index) => (
                      <tr key={index} className="border-b border-blue-800/30">
                        <td className="py-3">{transaction.date}</td>
                        <td className="py-3 text-green-400">+{transaction.gain}€</td>
                        <td className="py-3">{transaction.report}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400">Aucune transaction pour le moment.</p>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-[#162032] rounded-lg">
            <h2 className="text-2xl font-bold text-white">Page "{selectedNavItem}" en cours de développement</h2>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      username={userData.username}
      subscription={userData.subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;

import React from 'react';
import SummaryPanel from '@/components/dashboard/SummaryPanel';
import TransactionsList from '@/components/dashboard/TransactionsList';
import LocationFeed from '@/components/LocationFeed';

interface Transaction {
  date: string;
  gain: number;
  report: string;
}

interface DashboardMetricsProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal: () => void;
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referrals?: any[];
}

const DashboardMetrics = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription,
  dailySessionCount = 0,
  canStartSession = true,
  referrals = []
}: DashboardMetricsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SummaryPanel 
          balance={balance}
          referralLink={referralLink}
          isStartingSession={isStartingSession}
          handleStartSession={handleStartSession}
          handleWithdrawal={handleWithdrawal}
          isNewUser={isNewUser}
          subscription={subscription}
          dailySessionCount={dailySessionCount}
          canStartSession={canStartSession}
          referralCount={referrals.length}
        />
        
        <TransactionsList 
          transactions={transactions} 
          isNewUser={isNewUser} 
        />
      </div>
      
      <div className="space-y-6">
        <div className="neuro-panel p-6">
          <h3 className="text-xl font-semibold text-[#1e3a5f] mb-4">Tableau de bord des gains</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Aujourd'hui</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">+{balance.toFixed(2)}€</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Cette semaine</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">+{(balance * 1.5).toFixed(2)}€</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Ce mois</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">+{(balance * 3).toFixed(2)}€</p>
            </div>
          </div>
        </div>
        
        <LocationFeed />
      </div>
    </div>
  );
};

export default DashboardMetrics;

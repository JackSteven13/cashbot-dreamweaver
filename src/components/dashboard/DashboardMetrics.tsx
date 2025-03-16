
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
}

const DashboardMetrics = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  handleWithdrawal,
  transactions,
  isNewUser = false,
  subscription
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
        />
        
        {transactions.length > 0 ? (
          <TransactionsList transactions={transactions} />
        ) : (
          <div className="neuro-panel p-6 text-center">
            <p className="text-gray-500">Aucune transaction pour le moment. Le système va bientôt commencer à générer des revenus pour vous.</p>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        <div className="neuro-panel p-6">
          <h3 className="text-xl font-semibold text-[#1e3a5f] mb-4">Tableau de bord des gains</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Aujourd'hui</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">+{(Math.random() * 5).toFixed(2)}€</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Cette semaine</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">+{(Math.random() * 15 + 5).toFixed(2)}€</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Ce mois</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">+{(Math.random() * 50 + 20).toFixed(2)}€</p>
            </div>
          </div>
        </div>
        
        <LocationFeed />
      </div>
    </div>
  );
};

export default DashboardMetrics;

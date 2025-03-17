
import React from 'react';
import { SummaryPanel } from '@/components/dashboard/summary';
import TransactionsList from '@/components/dashboard/TransactionsList';
import LocationFeed from '@/components/LocationFeed';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import { Referral, Transaction } from '@/types/userData';
import { calculateReferralBonus } from '@/utils/referralUtils';

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
  referrals?: Referral[];
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
  // Calculate referral bonus for display
  const referralBonus = calculateReferralBonus(referrals.length);

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
          referralBonus={referralBonus}
        />
        
        {/* Uniquement pour les nouveaux utilisateurs ou ceux qui ont un abonnement freemium */}
        {(isNewUser || subscription === 'freemium') && (
          <RevenueCalculator 
            currentSubscription={subscription}
            isNewUser={isNewUser}
          />
        )}
        
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
              <p className="text-2xl font-bold text-[#2d5f8a]">
                {isNewUser ? "0.00€" : `+${balance.toFixed(2)}€`}
              </p>
              {referralBonus > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Inclut bonus de parrainage: +{referralBonus}%
                </p>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Cette semaine</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">
                {isNewUser ? "0.00€" : `+${(balance * 1.5).toFixed(2)}€`}
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-[#334e68] font-medium">Ce mois</p>
              <p className="text-2xl font-bold text-[#2d5f8a]">
                {isNewUser ? "0.00€" : `+${(balance * 3).toFixed(2)}€`}
              </p>
            </div>
          </div>
        </div>
        
        <LocationFeed />
      </div>
    </div>
  );
};

export default DashboardMetrics;

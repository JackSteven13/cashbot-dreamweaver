
import React from 'react';
import { SummaryPanel } from '@/components/dashboard/summary';
import TransactionsList from '@/components/dashboard/TransactionsList';
import LocationFeed from '@/components/LocationFeed';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Referral, Transaction } from '@/types/userData';
import { calculateReferralBonus } from '@/utils/referralUtils';
import { TrendingUp, Calendar, PieChart } from 'lucide-react';

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
        <Card className="shadow-md border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Tableau de bord des gains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Aujourd'hui</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {isNewUser ? "0.00€" : `+${balance.toFixed(2)}€`}
                </p>
                {referralBonus > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Inclut bonus de parrainage: +{referralBonus}%
                  </p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Cette semaine</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {isNewUser ? "0.00€" : `+${(balance * 1.5).toFixed(2)}€`}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Ce mois</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {isNewUser ? "0.00€" : `+${(balance * 3).toFixed(2)}€`}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <LocationFeed />
      </div>
    </div>
  );
};

export default DashboardMetrics;

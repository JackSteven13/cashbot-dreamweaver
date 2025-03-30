
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RevenueCalculator from '@/components/dashboard/RevenueCalculator';
import EliteBadge from '@/components/subscriptions/EliteBadge';
import { Button } from '@/components/ui/button';
import { PieChart, Calendar, TrendingUp, Clock, BarChart, Activity } from 'lucide-react';
import { formatRevenue } from '@/utils/formatters';
import SessionCard from '@/components/SessionCard';

interface MainContentProps {
  balance: number;
  subscription: string;
  isNewUser: boolean;
  referrals?: any[];
  isTopReferrer?: boolean;
  canStartSession?: boolean;
  dailySessionCount?: number;
  referralCount?: number;
  referralBonus?: number;
  handleStartSession?: () => void;
  handleWithdrawal?: () => void;
  transactions?: any[];
}

const MainContent: React.FC<MainContentProps> = ({ 
  balance, 
  subscription,
  isNewUser,
  referrals,
  isTopReferrer,
  canStartSession = true,
  dailySessionCount = 0,
  referralCount = 0,
  referralBonus = 0,
  handleStartSession,
  handleWithdrawal,
  transactions = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Convert any "alpha" subscription to "starter"
  const displaySubscription = subscription === "alpha" ? "starter" : subscription;

  return (
    <Card className="col-span-1 md:col-span-2 animate-fade-in">
      <CardHeader>
        <CardTitle>Tableau de bord interactif</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <Activity className="h-4 w-4 mr-2" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <BarChart className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <PieChart className="h-4 w-4 mr-2" />
              Revenus
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 animate-fade-in">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                    Abonnement actuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200 mr-2">
                      {displaySubscription.charAt(0).toUpperCase() + displaySubscription.slice(1)}
                    </span>
                    {displaySubscription === 'elite' && <EliteBadge />}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                    Sessions aujourd'hui
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {dailySessionCount}
                    </div>
                    <Clock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              {isTopReferrer && (
                <Card className="shadow-md border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Top Parrain
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      Félicitations !
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {!isTopReferrer && (
                <Card className="shadow-md border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Parrainages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        {referralCount}
                      </div>
                      <div className="text-sm text-green-600">
                        {referralBonus > 0 ? `+${referralBonus}% bonus` : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    Revenus récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Aujourd'hui</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        +{formatRevenue(isNewUser ? 0 : balance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Cette semaine</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        +{formatRevenue(isNewUser ? 0 : balance * 1.5)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Ce mois</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        +{formatRevenue(isNewUser ? 0 : balance * 3)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-md border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-3">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      onClick={handleStartSession}
                      disabled={!canStartSession || isNewUser}
                    >
                      Lancer une session
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleWithdrawal}
                      disabled={balance < 100 || isNewUser}
                    >
                      Effectuer un retrait
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="transactions" className="animate-fade-in">
            <div className="space-y-4">
              {transactions && transactions.length > 0 ? (
                <div className="grid gap-4">
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <SessionCard 
                      key={index}
                      gain={transaction.gain || transaction.amount}
                      report={transaction.report || transaction.type}
                      date={new Date(transaction.date).toLocaleDateString()}
                    />
                  ))}
                  {transactions.length > 5 && (
                    <Button variant="outline" className="w-full mt-2">
                      Voir toutes les transactions
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p>Aucune transaction à afficher.</p>
                  {isNewUser && (
                    <p className="mt-2">Commencez à gagner des revenus en lançant votre première session!</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="revenue" className="animate-fade-in">
            <RevenueCalculator 
              currentSubscription={displaySubscription} 
              isNewUser={isNewUser}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MainContent;

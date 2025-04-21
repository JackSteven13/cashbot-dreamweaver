import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/hooks/useUserData';
import { CreditCard, Wallet, ArrowDownToLine, ArrowUpToLine, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getWithdrawalThreshold, getWithdrawalProgress } from '@/utils/referral/withdrawalUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PaymentMethod {
  id: string;
  type: string;
  lastFour: string;
  isDefault?: boolean;
}

const WalletPage = () => {
  const { userData, isLoading } = useUserData();
  const [progressValue, setProgressValue] = useState(0);
  const [withdrawalThreshold, setWithdrawalThreshold] = useState(0);

  useEffect(() => {
    if (userData) {
      const threshold = getWithdrawalThreshold(userData.subscription);
      setWithdrawalThreshold(threshold);
      
      const progress = getWithdrawalProgress(userData.balance, userData.subscription);
      setProgressValue(progress);
    }
  }, [userData]);

  const paymentMethods: PaymentMethod[] = [];

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Portefeuille</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Solde disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {isLoading ? "..." : `${userData?.balance.toFixed(2) || '0.00'} €`}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Progression</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        <span className="text-sm font-medium">{progressValue.toFixed(0)}%</span>
                        <Info className="h-3 w-3 ml-1" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Continuez à générer des revenus et à parrainer pour accélérer vos gains!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={progressValue} className="h-2" />
              <p className="text-xs text-blue-600 mt-1">
                {progressValue < 25 ? "Début prometteur! Continuez ainsi!" : 
                 progressValue < 50 ? "Vous progressez bien! Parrainez des amis pour accélérer!" : 
                 progressValue < 75 ? "Vous êtes sur la bonne voie! Continuez!" : 
                 "Presque là! Encore un peu d'efforts!"}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button size="sm" variant="outline">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Déposer
              </Button>
              <Button 
                size="sm"
                disabled={userData?.balance < withdrawalThreshold}
                title={userData?.balance < withdrawalThreshold ? `Objectif: ${withdrawalThreshold}€` : undefined}
                className={userData?.balance >= withdrawalThreshold ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <ArrowUpToLine className="mr-2 h-4 w-4" />
                {userData?.balance >= withdrawalThreshold ? "Retirer" : `Objectif: ${withdrawalThreshold}€`}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Moyens de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="mr-3 h-4 w-4" />
                      <div>
                        <p className="font-medium">{method.type}</p>
                        <p className="text-sm text-muted-foreground">****{method.lastFour}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Gérer</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">Aucun moyen de paiement enregistré.</p>
                <Button>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ajouter un moyen de paiement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>Vos 5 dernières transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center">Chargement des transactions...</div>
          ) : userData?.transactions && userData.transactions.length > 0 ? (
            <div className="space-y-3">
              {userData.transactions.slice(0, 5).map((transaction, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount ? transaction.amount.toFixed(2) : '0.00'} €
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" onClick={() => {}}>
                Voir toutes les transactions
              </Button>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Aucune transaction à afficher.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800/50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800 dark:text-purple-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Boostez vos revenus avec l'affiliation
          </CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-400">Les affiliés peuvent retirer leurs gains bien plus rapidement!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white dark:bg-purple-900/30 p-4 rounded-lg mb-4 border border-purple-100 dark:border-purple-800/50">
            <p className="font-medium mb-2 text-purple-900 dark:text-purple-300">Avantages exclusifs:</p>
            <ul className="list-disc ml-5 space-y-1 text-purple-800 dark:text-purple-300">
              <li><span className="font-medium">50% de commission</span> sur les gains de vos filleuls</li>
              <li><span className="font-medium">Accès prioritaire aux retraits</span> dès 3 parrainages actifs</li>
              <li><span className="font-medium">Bonus d'affiliation immédiat</span> pour chaque nouveau membre</li>
              <li><span className="font-medium">Frais de retrait réduits</span> pour les affiliateurs actifs</li>
            </ul>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Commencer à parrainer maintenant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;


import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/hooks/userData/useUserData';
import { TransactionsPanel } from '@/components/dashboard/transactions';
import { toast } from '@/components/ui/use-toast';

// Memoized component to avoid unnecessary re-renders
const TransactionsPage = memo(() => {
  const { userData, isLoading, refreshUserData } = useUserData();
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [retryCount, setRetryCount] = useState(0);
  
  // Add effect to automatically refresh data if needed
  useEffect(() => {
    let isMounted = true;
    
    if (!userData && !isLoading && retryCount < 3) {
      const timer = setTimeout(() => {
        if (isMounted) {
          console.log("Tentative de récupération des transactions...");
          refreshUserData();
          setRefreshKey(Date.now());
          setRetryCount(prev => prev + 1);
        }
      }, 2000);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [userData, isLoading, retryCount, refreshUserData]);
  
  // Memoized refresh handler to avoid recreations
  const handleManualRefresh = useCallback(async () => {
    try {
      toast({
        title: "Actualisation en cours",
        description: "Chargement des transactions...",
      });
      
      await refreshUserData();
      setRefreshKey(Date.now());
      
      toast({
        title: "Transactions mises à jour",
        description: "Les données ont été actualisées.",
      });
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir les données.",
        variant: "destructive",
      });
    }
  }, [refreshUserData]);
  
  // Ensure an empty array is provided if userData?.transactions is undefined
  const transactions = userData?.transactions || [];
  
  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des transactions</h1>
        <button 
          onClick={handleManualRefresh}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          disabled={isLoading}
        >
          {isLoading ? "Chargement..." : "Actualiser"}
        </button>
      </div>
      
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Vos transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Chargement des transactions...</div>
          ) : (
            <TransactionsPanel 
              key={refreshKey}
              transactions={transactions}
              isLoading={false}
              isNewUser={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
});

TransactionsPage.displayName = 'TransactionsPage';
export default TransactionsPage;

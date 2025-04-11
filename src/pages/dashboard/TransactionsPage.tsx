
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/hooks/useUserData';
import { TransactionsPanel } from '@/components/dashboard/transactions';
import { toast } from '@/components/ui/use-toast';

const TransactionsPage = () => {
  const { userData, isLoading, refreshUserData } = useUserData();
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [retryCount, setRetryCount] = useState(0);
  
  // Ajouter un effet pour rafraîchir automatiquement les données si nécessaire
  useEffect(() => {
    if (!userData && !isLoading && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log("Tentative de récupération des transactions...");
        refreshUserData();
        setRefreshKey(Date.now());
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userData, isLoading, retryCount, refreshUserData]);
  
  // Gestionnaire de rafraîchissement manuel mémorisé pour éviter les recréations
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
  
  // Garantir qu'un tableau vide est fourni si userData?.transactions n'est pas défini
  const transactions = userData?.transactions || [];
  const subscription = userData?.subscription || 'freemium';
  
  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des transactions</h1>
        <button 
          onClick={handleManualRefresh}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          Actualiser
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
              subscription={subscription}
              isNewUser={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;

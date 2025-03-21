
import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/hooks/useUserData';

const TransactionsPage = () => {
  const { userData, isLoading } = useUserData();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Historique des transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Vos transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Chargement des transactions...</div>
          ) : userData?.transactions && userData.transactions.length > 0 ? (
            <div className="space-y-4">
              {userData.transactions.map((transaction, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Aucune transaction à afficher.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;

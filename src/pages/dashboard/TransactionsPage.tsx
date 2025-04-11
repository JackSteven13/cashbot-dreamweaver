
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/hooks/useUserData';
import { 
  TransactionsPanel
} from '@/components/dashboard/transactions';

const TransactionsPage = () => {
  const { userData, isLoading } = useUserData();
  const [selectedNavItem, setSelectedNavItem] = useState('transactions');
  
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Historique des transactions</h1>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Vos transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Chargement des transactions...</div>
          ) : (
            <TransactionsPanel 
              transactions={userData?.transactions || []}
              subscription={userData?.subscription || 'freemium'}
              isNewUser={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;

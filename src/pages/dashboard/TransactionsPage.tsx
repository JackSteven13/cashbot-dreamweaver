
import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/hooks/useUserData';
import TransactionsList from '@/components/dashboard/TransactionsList';

const TransactionsPage = () => {
  const { userData, isLoading } = useUserData();
  const [selectedNavItem, setSelectedNavItem] = useState('transactions');

  // If userData is not available yet, provide default values
  const username = userData?.username || '';
  const subscription = userData?.subscription || 'freemium';

  return (
    <DashboardLayout
      username={username}
      subscription={subscription}
      selectedNavItem={selectedNavItem}
      setSelectedNavItem={setSelectedNavItem}
    >
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-6">Historique des transactions</h1>
        <Card>
          <CardHeader>
            <CardTitle>Vos transactions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Chargement des transactions...</div>
            ) : (
              <TransactionsList 
                transactions={userData?.transactions || []}
                isNewUser={false}
                subscription={userData?.subscription || 'freemium'}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransactionsPage;

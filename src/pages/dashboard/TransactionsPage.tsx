
import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/hooks/useUserData';
import { useTransactions } from '@/components/dashboard/transactions/useTransactions';
import { 
  TransactionListItem, 
  TransactionEmptyState,
  TransactionListActions,
  TransactionFooter
} from '@/components/dashboard/transactions';

const TransactionsPage = () => {
  const { userData, isLoading } = useUserData();
  const [selectedNavItem, setSelectedNavItem] = useState('transactions');

  // If userData is not available yet, provide default values
  const username = userData?.username || '';
  const subscription = userData?.subscription || 'freemium';
  
  const {
    showAllTransactions,
    setShowAllTransactions,
    validTransactions,
    displayedTransactions,
    refreshKey,
    handleManualRefresh,
    hiddenTransactionsCount
  } = useTransactions(userData?.transactions || []);

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
          <CardHeader className="pb-0">
            <CardTitle>Vos transactions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Chargement des transactions...</div>
            ) : (
              <>
                <TransactionListActions 
                  showAllTransactions={showAllTransactions}
                  setShowAllTransactions={setShowAllTransactions}
                  validTransactionsCount={validTransactions.length}
                  onManualRefresh={handleManualRefresh}
                />
                
                {validTransactions.length > 0 ? (
                  <div className="space-y-4 mt-4">
                    {displayedTransactions.map((transaction, index) => (
                      <TransactionListItem 
                        key={transaction.id || `transaction-${index}`}
                        transaction={transaction}
                        refreshKey={refreshKey}
                        index={index}
                        subscription={subscription}
                      />
                    ))}
                    
                    <TransactionFooter 
                      showAllTransactions={showAllTransactions}
                      hiddenTransactionsCount={hiddenTransactionsCount}
                    />
                  </div>
                ) : (
                  <TransactionEmptyState isNewUser={false} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransactionsPage;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import TransactionEmptyState from './TransactionEmptyState';
import TransactionListItem from './TransactionListItem';
import { useUserData } from '@/hooks/useUserData';

interface TransactionsPanelProps {
  transactions: any[];
  isLoading?: boolean;
  isNewUser?: boolean;
  title?: string;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
  transactions = [],
  isLoading = false,
  isNewUser = false,
  title = "Transactions récentes"
}) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshUserData } = useUserData();

  // Rafraîchir périodiquement les transactions
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(Date.now());
    }, 30000); // Rafraîchir toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, []);
  
  // Écouter les événements de rafraîchissement
  useEffect(() => {
    const handleRefresh = () => {
      console.log("Transaction refresh event received in TransactionsPanel");
      setRefreshKey(Date.now());
    };
    
    window.addEventListener('transactions:refresh', handleRefresh);
    window.addEventListener('balance:update', handleRefresh);
    
    return () => {
      window.removeEventListener('transactions:refresh', handleRefresh);
      window.removeEventListener('balance:update', handleRefresh);
    };
  }, []);

  const handleViewAllClick = () => {
    navigate('/dashboard/transactions');
  };
  
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshUserData();
      setRefreshKey(Date.now());
      console.log("Transactions manually refreshed");
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {transactions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleViewAllClick} className="gap-1">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction, index) => (
              <TransactionListItem 
                key={`${transaction.id || ''}-${index}-${refreshKey}`}
                transaction={transaction}
                refreshKey={refreshKey}
                index={index}
              />
            ))}
          </div>
        ) : (
          <TransactionEmptyState isNewUser={isNewUser} />
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsPanel;

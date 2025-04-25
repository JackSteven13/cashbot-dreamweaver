import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import TransactionEmptyState from './TransactionEmptyState';
import TransactionListItem from './TransactionListItem';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface TransactionsPanelProps {
  transactions: any[];
  isLoading?: boolean;
  isNewUser?: boolean;
  title?: string;
  subscription?: string;
}

const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
  transactions = [],
  isLoading = false,
  isNewUser = false,
  title = "Transactions récentes",
  subscription = 'freemium'
}) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshUserData } = useUserData();
  const { user } = useAuth();
  const [localTransactions, setLocalTransactions] = useState<any[]>(transactions);

  const fetchLatestTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsRefreshing(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        const formattedTx = data.map((tx: any) => ({
          id: tx.id,
          date: tx.created_at || tx.date,
          amount: tx.gain,
          gain: tx.gain,
          report: tx.report,
          type: tx.type || 'system'
        }));
        
        setLocalTransactions(formattedTx);
        setRefreshKey(Date.now());
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestTransactions();
    }, 20000);
    
    return () => clearInterval(interval);
  }, [fetchLatestTransactions]);
  
  useEffect(() => {
    if (!user?.id) return;
    
    const transactionChannel = supabase
      .channel('transactions-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          console.log('Transaction change detected in Supabase - refreshing panel');
          fetchLatestTransactions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(transactionChannel);
    };
  }, [user, fetchLatestTransactions]);
  
  useEffect(() => {
    const handleRefresh = () => {
      console.log("Transaction refresh event received in TransactionsPanel");
      fetchLatestTransactions();
    };
    
    window.addEventListener('transactions:refresh', handleRefresh);
    window.addEventListener('balance:update', handleRefresh);
    window.addEventListener('transactions:updated', handleRefresh);
    window.addEventListener('automatic:revenue', handleRefresh);
    window.addEventListener('session:completed', handleRefresh);
    
    fetchLatestTransactions();
    
    return () => {
      window.removeEventListener('transactions:refresh', handleRefresh);
      window.removeEventListener('balance:update', handleRefresh);
      window.removeEventListener('transactions:updated', handleRefresh);
      window.removeEventListener('automatic:revenue', handleRefresh);
      window.removeEventListener('session:completed', handleRefresh);
    };
  }, [fetchLatestTransactions]);

  const handleViewAllClick = () => {
    navigate('/dashboard/transactions');
  };
  
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshUserData();
      await fetchLatestTransactions();
      
      toast({
        title: "Transactions actualisées",
        description: "Les dernières transactions ont été chargées",
        duration: 2000,
      });
      
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

  const displayTransactions = localTransactions.length > 0 ? localTransactions : transactions;

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
          {displayTransactions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleViewAllClick} className="gap-1">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayTransactions.length > 0 ? (
          <div className="space-y-2">
            {displayTransactions.slice(0, 5).map((transaction, index) => (
              <TransactionListItem 
                key={`${transaction.id || ''}-${index}-${refreshKey}`}
                transaction={transaction}
                refreshKey={refreshKey}
                index={index}
                subscription={subscription}
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

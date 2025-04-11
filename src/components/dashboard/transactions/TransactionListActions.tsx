
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";

interface TransactionListActionsProps {
  showAllTransactions: boolean;
  setShowAllTransactions: (show: boolean) => void;
  validTransactionsCount: number;
  onManualRefresh: () => Promise<void>;
}

const TransactionListActions = ({
  showAllTransactions,
  setShowAllTransactions,
  validTransactionsCount,
  onManualRefresh
}: TransactionListActionsProps) => {
  
  const handleViewFullHistory = () => {
    setShowAllTransactions(true);
  };
  
  const handleManualRefresh = async () => {
    await onManualRefresh();
    toast({
      title: "Transactions actualisées",
      description: "La liste des transactions a été mise à jour.",
      duration: 2000
    });
  };
  
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold text-[#1e3a5f]">Sessions récentes</h2>
      <div className="flex gap-2">
        {validTransactionsCount > 3 && !showAllTransactions && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewFullHistory}
            className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]"
          >
            Voir l'historique complet
          </Button>
        )}
        {showAllTransactions && validTransactionsCount > 3 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]"
            onClick={() => setShowAllTransactions(false)}
          >
            Réduire l'historique
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualRefresh}
          className="text-[#334e68] hover:bg-[#e2e8f0]"
        >
          Actualiser
        </Button>
      </div>
    </div>
  );
};

export default TransactionListActions;

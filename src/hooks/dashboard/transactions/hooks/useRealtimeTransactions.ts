
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer les mises à jour en temps réel des transactions
 */
export const useRealtimeTransactions = (userId: string | undefined, onUpdate: () => void) => {
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('realtime_transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      }, () => {
        console.log('Mise à jour en temps réel des transactions détectée');
        onUpdate();
      })
      .subscribe();
      
    // Déclencher une mise à jour initiale
    onUpdate();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
};

export default useRealtimeTransactions;

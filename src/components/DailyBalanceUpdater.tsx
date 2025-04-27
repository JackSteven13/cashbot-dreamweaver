
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import balanceManager from '@/utils/balance/balanceManager';
import { calculateTodaysGains } from '@/utils/userData/transactionUtils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Composant invisible qui gère les mises à jour régulières du solde
 */
interface DailyBalanceUpdaterProps {
  userId: string;
}

const DailyBalanceUpdater: React.FC<DailyBalanceUpdaterProps> = ({ userId }) => {
  const { user } = useAuth();
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  const userIdRef = useRef<string | undefined>(userId);
  
  // Synchroniser périodiquement avec la base de données
  useEffect(() => {
    if (!userId) return;
    
    userIdRef.current = userId;
    
    // Vérification initiale
    const initializeBalance = async () => {
      if (!userId || isInitializedRef.current) return;
      
      try {
        // Récupérer le solde depuis la base de données
        const { data, error } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error("Erreur lors de la récupération du solde:", error);
          return;
        }
        
        // Récupérer les gains d'aujourd'hui
        const todaysGains = await calculateTodaysGains(userId);
        
        // Mettre à jour le gestionnaire avec les valeurs récupérées
        if (data?.balance !== undefined) {
          const currentManagerBalance = balanceManager.getCurrentBalance();
          
          // Toujours utiliser le solde le plus élevé pour éviter les pertes
          const effectiveBalance = Math.max(data.balance, currentManagerBalance);
          
          if (effectiveBalance > currentManagerBalance) {
            balanceManager.forceBalanceSync(effectiveBalance, userId);
            console.log(`Solde initialisé à ${effectiveBalance}€`);
          }
          
          // Initialiser les gains quotidiens
          if (todaysGains > 0) {
            balanceManager.setDailyGains(todaysGains);
            console.log(`Gains quotidiens initialisés à ${todaysGains}€`);
          }
        }
        
        isInitializedRef.current = true;
        
      } catch (err) {
        console.error("Erreur lors de l'initialisation du solde:", err);
      }
    };
    
    initializeBalance();
    
    // Vérifier périodiquement les mises à jour
    const syncInterval = setInterval(async () => {
      if (!userId) return;
      
      const now = Date.now();
      
      // Limiter la fréquence des synchronisations (au plus une fois par minute)
      if (now - lastSyncTime < 60000) return;
      
      try {
        // Récupérer le solde depuis la base de données
        const { data, error } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('id', userId)
          .single();
          
        if (error) return;
        
        // Récupérer les gains d'aujourd'hui
        const todaysGains = await calculateTodaysGains(userId);
        
        // Mettre à jour le gestionnaire avec les valeurs récupérées
        if (data?.balance !== undefined) {
          const currentManagerBalance = balanceManager.getCurrentBalance();
          
          // Ne pas permettre au solde de diminuer sans raison, toujours utiliser le plus élevé
          if (data.balance > currentManagerBalance) {
            balanceManager.forceBalanceSync(data.balance, userId);
            
            // Notifier les autres composants de la mise à jour
            window.dispatchEvent(new CustomEvent('db:balance-updated', {
              detail: { newBalance: data.balance, animate: false }
            }));
          } else if (data.balance < currentManagerBalance) {
            // Si le solde du serveur est plus bas, mettre à jour le serveur avec notre valeur locale
            console.log(`Correction du solde serveur: ${data.balance}€ -> ${currentManagerBalance}€`);
            
            await supabase
              .from('user_balances')
              .update({ 
                balance: currentManagerBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
          }
          
          // Mettre à jour les gains quotidiens si nécessaire
          if (todaysGains > balanceManager.getDailyGains()) {
            balanceManager.setDailyGains(todaysGains);
          }
        }
        
        setLastSyncTime(now);
      } catch (err) {
        console.error("Erreur lors de la synchronisation du solde:", err);
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [userId, lastSyncTime]);

  return null; // Composant invisible qui ne rend rien à l'écran
};

export default DailyBalanceUpdater;

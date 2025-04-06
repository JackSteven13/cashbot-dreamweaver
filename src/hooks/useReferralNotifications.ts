
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserSession } from './useUserSession';

export const useReferralNotifications = () => {
  const { session } = useUserSession();
  const [lastNotificationDate, setLastNotificationDate] = useState<string | null>(null);
  
  // Fonction pour vérifier les nouveaux parrainages
  const checkNewReferrals = async (userId: string) => {
    try {
      // Récupérer la dernière date de notification de localStorage
      const storedLastDate = localStorage.getItem('lastReferralNotificationDate');
      const dateFilter = storedLastDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Utiliser la requête pour trouver de nouveaux parrainages
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .gt('created_at', dateFilter)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Erreur lors de la vérification des parrainages:", error);
        return;
      }
      
      if (data && data.length > 0) {
        // Mettre à jour la date de dernière notification
        const newLastDate = data[0].created_at;
        localStorage.setItem('lastReferralNotificationDate', newLastDate);
        setLastNotificationDate(newLastDate);
        
        // Afficher une notification pour chaque nouveau parrainage
        data.forEach(referral => {
          toast.success('Nouveau filleul !', {
            description: `Vous avez un nouveau filleul avec un abonnement ${referral.plan_type}. Commission: ${referral.commission_rate.toFixed(2)}€`,
            duration: 8000,
          });
        });
        
        // Déclencher un événement pour informer le dashboard de mettre à jour le solde
        window.dispatchEvent(new CustomEvent('referral:update', { 
          detail: { 
            count: data.length,
            totalCommission: data.reduce((sum, ref) => sum + Number(ref.commission_rate), 0)
          }
        }));
      }
    } catch (error) {
      console.error("Erreur dans checkNewReferrals:", error);
    }
  };
  
  useEffect(() => {
    if (session?.user?.id) {
      // Vérifier au chargement initial
      checkNewReferrals(session.user.id);
      
      // Configurer une vérification périodique (toutes les 5 minutes)
      const intervalId = setInterval(() => {
        checkNewReferrals(session.user.id);
      }, 5 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [session?.user?.id]);
  
  return {
    lastNotificationDate,
    checkNewReferrals: session?.user?.id ? () => checkNewReferrals(session.user.id) : null
  };
};

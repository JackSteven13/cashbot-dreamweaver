
import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from "@/integrations/supabase/client";
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface DailyBalanceUpdaterProps {
  userId: string;
}

// Composant invisible qui s'assure que le solde est actualisé régulièrement
const DailyBalanceUpdater: React.FC<DailyBalanceUpdaterProps> = ({ userId }) => {
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  // S'assurer que le userId est défini dans le balance manager
  useEffect(() => {
    if (userId) {
      balanceManager.setUserId(userId);
      console.log("DailyBalanceUpdater: userId défini dans balanceManager:", userId);
    }
  }, [userId]);
  
  // Crée un intervalle pour déclencher une mise à jour automatique
  useEffect(() => {
    // Déclencher une mise à jour auto après un léger délai
    const delayedUpdate = setTimeout(() => {
      triggerAutomaticRevenueGeneration();
    }, 5000); // Délai augmenté à 5 secondes
    
    // Mettre en place une mise à jour périodique moins fréquente (30-60 secondes)
    updateIntervalRef.current = setInterval(() => {
      triggerAutomaticRevenueGeneration();
    }, 30000 + Math.random() * 30000); // Entre 30 et 60 secondes
    
    return () => {
      clearTimeout(delayedUpdate);
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [userId]);
  
  // Fonction pour déclencher la génération automatique de revenus
  const triggerAutomaticRevenueGeneration = async () => {
    if (!userId) return;
    
    try {
      // Vérifier d'abord si la limite quotidienne est atteinte
      const { data: userData } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', userId)
        .single();
      
      const subscription = userData?.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Obtenir les gains quotidiens actuels
      const dailyGains = balanceManager.getDailyGains();
      
      // Vérifier si la limite est atteinte
      if (dailyGains >= dailyLimit) {
        console.log(`Génération automatique bloquée: limite quotidienne atteinte (${dailyGains.toFixed(2)}€/${dailyLimit}€)`);
        return;
      }
      
      // Générer un montant plus petit (entre 0.01€ et 0.05€)
      const gain = 0.01 + Math.random() * 0.04;
      const roundedGain = parseFloat(gain.toFixed(2));
      
      // Vérifier si ce gain fera dépasser la limite
      if (dailyGains + roundedGain > dailyLimit) {
        const adjustedGain = Math.max(0.01, parseFloat((dailyLimit - dailyGains).toFixed(2)));
        console.log(`Gain ajusté pour respecter la limite: ${roundedGain}€ -> ${adjustedGain}€`);
        
        // Si l'ajustement est trop faible, annuler la génération
        if (adjustedGain < 0.01) {
          console.log("Gain ajusté trop faible, génération annulée");
          return;
        }
        
        // Utiliser le gain ajusté
        const finalGain = adjustedGain;
        
        // Créer un événement pour que tout composant qui écoute puisse réagir
        window.dispatchEvent(new CustomEvent('auto:revenue-generated', {
          detail: { 
            amount: finalGain,
            userId: userId,
            timestamp: Date.now()
          }
        }));
        
        console.log(`Génération automatique de revenus: +${finalGain.toFixed(2)}€`);
        
        // Mettre à jour le solde local
        balanceManager.updateBalance(finalGain);
        balanceManager.addDailyGain(finalGain);
        
        // Ajouter une transaction en arrière-plan
        const report = `Analyse automatique (${new Date().toLocaleTimeString()})`;
        await supabase
          .from('transactions')
          .insert([
            { user_id: userId, gain: finalGain, report, date: new Date().toISOString() }
          ]);
          
        // Mettre à jour le solde dans la base de données
        const { data: userBalanceData } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('id', userId)
          .single();
          
        const newBalance = (userBalanceData?.balance || 0) + finalGain;
        
        await supabase
          .from('user_balances')
          .update({ balance: newBalance })
          .eq('id', userId);
          
        // Forcer une mise à jour de l'interface avec animation
        window.dispatchEvent(new CustomEvent('balance:update', {
          detail: {
            amount: finalGain,
            animate: true,
            userId: userId,
            timestamp: Date.now()
          }
        }));
        
        // Si cette transaction a atteint la limite, déclencher l'événement de limite atteinte
        if (dailyGains + finalGain >= dailyLimit) {
          window.dispatchEvent(new CustomEvent('daily-limit:reached', {
            detail: {
              subscription: subscription,
              limit: dailyLimit,
              currentGains: dailyGains + finalGain,
              userId: userId
            }
          }));
        }
        
        return;
      }
      
      // Création standard de transaction si aucun ajustement n'est nécessaire
      window.dispatchEvent(new CustomEvent('auto:revenue-generated', {
        detail: { 
          amount: roundedGain,
          userId: userId,
          timestamp: Date.now()
        }
      }));
      
      console.log(`Génération automatique de revenus: +${roundedGain.toFixed(2)}€`);
      
      // Mettre à jour le solde local
      balanceManager.updateBalance(roundedGain);
      balanceManager.addDailyGain(roundedGain);
      
      // Ajouter une transaction en arrière-plan
      const report = `Analyse automatique (${new Date().toLocaleTimeString()})`;
      await supabase
        .from('transactions')
        .insert([
          { user_id: userId, gain: roundedGain, report, date: new Date().toISOString() }
        ]);
        
      // Mettre à jour le solde dans la base de données
      const { data: userBalanceData } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
        
      const newBalance = (userBalanceData?.balance || 0) + roundedGain;
      
      await supabase
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('id', userId);
        
      // Forcer une mise à jour de l'interface avec animation
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: roundedGain,
          animate: true,
          userId: userId,
          timestamp: Date.now()
        }
      }));
      
    } catch (error) {
      console.error("Erreur lors de la génération automatique de revenus:", error);
    }
  };
  
  // Ce composant ne rend rien visuellement
  return null;
};

export default DailyBalanceUpdater;

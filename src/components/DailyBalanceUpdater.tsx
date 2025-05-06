
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
  const lastUpdateRef = useRef<number>(Date.now());
  
  // S'assurer que le userId est défini dans le balance manager
  useEffect(() => {
    if (userId) {
      balanceManager.setUserId(userId);
      localStorage.setItem('current_user_id', userId); // Stocker l'ID utilisateur actuel
      console.log("DailyBalanceUpdater: userId défini dans balanceManager:", userId);
    }
  }, [userId]);
  
  // Fonction pour vérifier si nous devons réinitialiser pour un nouveau jour
  useEffect(() => {
    if (!userId) return;
    
    const checkForDayChange = () => {
      const lastSessionDate = localStorage.getItem(`last_session_date_${userId}`);
      const today = new Date().toDateString();
      
      // Si c'est un nouveau jour ou si la date n'est pas définie, réinitialiser les limites
      if (!lastSessionDate || lastSessionDate !== today) {
        console.log("Nouveau jour détecté ou premier démarrage! Réinitialisation des limites quotidiennes.");
        
        // Supprimer les marqueurs de limite
        localStorage.removeItem(`daily_limit_reached_${userId}`);
        localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
        
        // Réinitialiser les gains quotidiens
        balanceManager.resetDailyGains();
        
        // Réactiver le bot
        window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
          detail: { active: true, reason: 'new_day' } 
        }));
        
        // Mettre à jour la date
        localStorage.setItem(`last_session_date_${userId}`, today);
      }
    };
    
    // Vérifier immédiatement
    checkForDayChange();
    
    // Puis vérifier périodiquement
    const dayCheckInterval = setInterval(checkForDayChange, 60000); // Toutes les minutes
    
    return () => clearInterval(dayCheckInterval);
  }, [userId]);
  
  // Crée un intervalle pour déclencher une mise à jour automatique
  useEffect(() => {
    // Déclencher une mise à jour auto après un léger délai au démarrage
    const delayedUpdate = setTimeout(() => {
      triggerAutomaticRevenueGeneration();
    }, 5000); // 5 secondes après le chargement
    
    // Mettre en place une mise à jour périodique
    updateIntervalRef.current = setInterval(() => {
      // Vérifier si suffisamment de temps s'est écoulé depuis la dernière mise à jour
      if (Date.now() - lastUpdateRef.current > 45000) { // Au moins 45 secondes entre les mises à jour
        triggerAutomaticRevenueGeneration();
      }
    }, 45000 + Math.random() * 15000); // Entre 45 et 60 secondes
    
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
      // Mise à jour du timestamp de dernière mise à jour
      lastUpdateRef.current = Date.now();
      
      // Vérifier d'abord si la limite quotidienne est atteinte
      const { data: userData, error: userError } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error("Erreur lors de la récupération des données utilisateur:", userError);
        return;
      }
      
      const subscription = userData?.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Obtenir les gains quotidiens actuels
      const dailyGains = balanceManager.getDailyGains();
      
      // Vérifier si la limite est déjà marquée comme atteinte
      const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
      
      // Vérifier si la limite est atteinte
      if (limitReached || dailyGains >= dailyLimit) {
        console.log(`Génération automatique bloquée: limite quotidienne atteinte (${dailyGains.toFixed(2)}€/${dailyLimit}€)`);
        
        // Marquer la limite comme atteinte si ce n'est pas déjà fait
        if (!limitReached) {
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
          
          // Désactiver le bot automatique
          window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
            detail: { active: false, reason: 'limit_reached' } 
          }));
        }
        
        return;
      }
      
      // Générer un montant plus petit
      const gain = 0.01 + Math.random() * 0.03; // Entre 0.01€ et 0.04€
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
        
        try {
          // Correction du type error avec as any
          const { error: txError } = await supabase
            .from('transactions')
            .insert([
              { user_id: userId, gain: finalGain, report, date: new Date().toISOString() }
            ]) as any;
            
          if (txError) {
            console.error("Erreur lors de l'ajout de la transaction:", txError);
            return;
          }
        } catch (err) {
          console.error("Erreur lors de l'insertion de la transaction:", err);
          return;
        }
          
        // Mettre à jour le solde dans la base de données
        try {
          // Correction du type error avec as any
          const { data: userBalanceData, error: balanceError } = await supabase
            .from('user_balances')
            .select('balance')
            .eq('id', userId)
            .single() as any;
            
          if (balanceError) {
            console.error("Erreur lors de la récupération du solde:", balanceError);
            return;
          }
          
          const newBalance = (userBalanceData?.balance || 0) + finalGain;
          
          // Correction du type error avec as any
          const { error: updateError } = await supabase
            .from('user_balances')
            .update({ balance: newBalance })
            .eq('id', userId) as any;
            
          if (updateError) {
            console.error("Erreur lors de la mise à jour du solde:", updateError);
            return;
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour du solde dans la base de données:", err);
          return;
        }
          
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
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          
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
      
      try {
        // Ajouter une transaction en arrière-plan
        const report = `Analyse automatique (${new Date().toLocaleTimeString()})`;
        
        // Correction du type error avec as any
        const { error: txError } = await supabase
          .from('transactions')
          .insert([
            { user_id: userId, gain: roundedGain, report, date: new Date().toISOString() }
          ]) as any;
          
        if (txError) {
          console.error("Erreur lors de l'ajout de la transaction:", txError);
          return;
        }
      } catch (err) {
        console.error("Erreur lors de l'insertion de la transaction:", err);
        return;
      }
        
      try {
        // Mettre à jour le solde dans la base de données
        // Correction du type error avec as any
        const { data: userBalanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('id', userId)
          .single() as any;
          
        if (balanceError) {
          console.error("Erreur lors de la récupération du solde:", balanceError);
          return;
        }
        
        const newBalance = (userBalanceData?.balance || 0) + roundedGain;
        
        // Correction du type error avec as any
        const { error: updateError } = await supabase
          .from('user_balances')
          .update({ balance: newBalance })
          .eq('id', userId) as any;
          
        if (updateError) {
          console.error("Erreur lors de la mise à jour du solde:", updateError);
          return;
        }
      } catch (err) {
        console.error("Erreur lors de la mise à jour du solde dans la base de données:", err);
        return;
      }
        
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

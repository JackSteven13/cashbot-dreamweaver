
import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from "@/integrations/supabase/client";
import { UserData } from '@/types/userData';

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
    }, 2000);
    
    // Mettre en place une mise à jour périodique
    updateIntervalRef.current = setInterval(() => {
      triggerAutomaticRevenueGeneration();
    }, 60000 + Math.random() * 30000); // Entre 60 et 90 secondes
    
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
      // Générer un petit montant et le sauvegarder directement
      const gain = 0.01 + Math.random() * 0.04; // Entre 0.01 et 0.05
      
      // Créer un événement pour que tout composant qui écoute puisse réagir
      window.dispatchEvent(new CustomEvent('auto:revenue-generated', {
        detail: { 
          amount: gain,
          userId: userId
        }
      }));
      
      // Mettre à jour le solde local
      balanceManager.updateBalance(gain);
      balanceManager.addDailyGain(gain);
      
      // Ajouter une transaction en arrière-plan
      const report = `Analyse automatique (${new Date().toLocaleTimeString()})`;
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          { user_id: userId, gain, report }
        ]);
        
      if (error) {
        console.error("Erreur lors de l'enregistrement de la transaction:", error);
        return;
      }
      
      // Mettre à jour le solde dans la base de données
      const { data: userData, error: userError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error("Erreur lors de la récupération du solde:", userError);
        return;
      }
      
      const newBalance = (userData.balance || 0) + gain;
      
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('id', userId);
        
      if (updateError) {
        console.error("Erreur lors de la mise à jour du solde:", updateError);
        return;
      }
      
      // Forcer une mise à jour de l'interface
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          animate: false
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

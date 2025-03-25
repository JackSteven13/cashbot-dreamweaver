import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ProTrialBannerProps {
  onClick: () => void;
}

export const ProTrialBanner: React.FC<ProTrialBannerProps> = ({ onClick }) => {
  const [hasUsedProTrial, setHasUsedProTrial] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'utilisateur a déjà utilisé l'offre Pro gratuite
    const checkProTrialStatus = async () => {
      const proTrialUsed = localStorage.getItem('proTrialUsed');
      
      if (proTrialUsed === 'true') {
        setHasUsedProTrial(true);
        return;
      }
      
      // Vérification supplémentaire côté serveur pour plus de sécurité
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase
            .from('user_balances')
            .select('id, pro_trial_used')
            .eq('id', session.user.id)
            .single();
            
          if (!error && data && data.pro_trial_used) {
            localStorage.setItem('proTrialUsed', 'true');
            setHasUsedProTrial(true);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut de l'essai Pro:", error);
      }
    };
    
    checkProTrialStatus();
  }, []);
  
  // Ne pas afficher la bannière si l'utilisateur a déjà utilisé l'offre
  if (hasUsedProTrial) {
    return null;
  }

  return (
    <div onClick={onClick} className="cursor-pointer mb-4">
      <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-3 rounded-lg border border-blue-700/50 hover:bg-blue-800/30 transition-colors">
        <p className="text-blue-300 text-xs font-medium text-center">
          ✨ CLIQUEZ ICI pour activer 48h d'accès Pro GRATUIT ✨
        </p>
      </div>
    </div>
  );
};

export const ProTrialActive: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState<string>("");
  
  useEffect(() => {
    const updateRemainingTime = () => {
      // Récupérer le timestamp d'expiration
      const expiryTime = parseInt(localStorage.getItem('proTrialExpires') || '0', 10);
      
      // Récupérer le timestamp d'activation (pour vérification)
      const activatedAt = parseInt(localStorage.getItem('proTrialActivatedAt') || '0', 10);
      
      const now = Date.now();
      const remainingMs = expiryTime - now;
      
      // Vérifier si l'essai est expiré
      if (remainingMs <= 0) {
        // Trial expired
        localStorage.removeItem('proTrialActive');
        localStorage.removeItem('proTrialExpires');
        localStorage.removeItem('proTrialActivatedAt');
        localStorage.setItem('proTrialUsed', 'true');
        window.location.reload();
        return;
      }
      
      // Calculer le nombre total d'heures (y compris les jours convertis en heures)
      const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      // Formater comme heures:minutes:secondes
      const timeString = `${totalHours}h ${minutes}m ${seconds}s`;
      setRemainingTime(timeString);
      
      // Log pour débogage (sera supprimé en production)
      console.log(`Temps restant Pro Trial: ${timeString}`);
      console.log(`Activé le: ${new Date(activatedAt).toLocaleString()}`);
      console.log(`Expire le: ${new Date(expiryTime).toLocaleString()}`);
    };
    
    // Mettre à jour immédiatement au premier rendu
    updateRemainingTime();
    
    // Puis mettre à jour toutes les secondes
    const intervalId = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-900/40 to-blue-700/20 p-3 rounded-lg border border-blue-700/50 mb-4">
      <p className="text-blue-300 text-xs font-medium text-center">
        ✅ Accès Pro activé ! Temps restant: {remainingTime}
      </p>
    </div>
  );
};

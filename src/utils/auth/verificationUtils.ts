
import { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';

/**
 * Vérification améliorée de la connexion réseau avec plusieurs méthodes
 */
const checkNetworkConnectivity = async (): Promise<boolean> => {
  // Si le navigateur indique hors ligne, c'est déjà un bon indicateur
  if (!navigator.onLine) {
    console.log("Le navigateur rapporte être hors ligne");
    return false;
  }
  
  try {
    // Utiliser l'URL de base de Supabase avec un timestamp pour contourner le cache
    const timestamp = new Date().getTime();
    const response = await fetch(`${SUPABASE_URL}?_=${timestamp}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      },
      credentials: 'omit'
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification de connectivité:", error);
    return navigator.onLine;
  }
};

/**
 * Vérification d'authentification robuste avec réessai et contrôle réseau
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Vérification d'authentification");
    
    // Vérifier la connectivité réseau d'abord
    const isNetworkAvailable = await checkNetworkConnectivity();
    if (!isNetworkAvailable) {
      console.log("Réseau non disponible");
      return false;
    }
    
    // Ajouter un court délai pour éviter les problèmes de race condition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Premier essai direct pour vérifier la session
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erreur lors de la vérification de session:", sessionError);
        // Continue à la tentative de rafraîchissement
      } else if (sessionData?.session?.user?.id) {
        console.log("Session valide trouvée directement");
        return true;
      }
    } catch (err) {
      console.error("Exception lors de la première vérification:", err);
      // Continue à la tentative de rafraîchissement
    }
    
    // Deuxième essai - tenter de rafraîchir la session
    try {
      console.log("Tentative de rafraîchissement de la session");
      const { data: refreshData } = await supabase.auth.refreshSession();
      
      if (refreshData?.session?.user?.id) {
        console.log("Session rafraîchie avec succès");
        return true;
      }
    } catch (refreshErr) {
      console.error("Erreur lors du rafraîchissement:", refreshErr);
    }
    
    // Dernier essai sans erreur
    try {
      // Nettoyage pour s'assurer qu'il n'y a pas de données pouvant causer des conflits
      localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
      
      // Attente supplémentaire
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérification finale
      const { data: finalCheck } = await supabase.auth.getSession();
      
      if (finalCheck?.session?.user?.id) {
        console.log("Session valide trouvée après rafraîchissement");
        return true;
      }
      
      console.log("Aucune session valide trouvée après tous les essais");
      return false;
    } catch (finalErr) {
      console.error("Exception lors de la vérification finale:", finalErr);
      return false;
    }
  } catch (error) {
    console.error("Exception générale lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Version simplifiée pour les vérifications rapides
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};

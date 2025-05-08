import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, Zap, Crown } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatusIndicatorProps {
  isLoading: boolean;
  currentSubscription: string | null;
}

const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({
  isLoading,
  currentSubscription
}) => {
  const [verifiedSubscription, setVerifiedSubscription] = useState<string | null>(currentSubscription);
  
  // Effet pour vérifier la cohérence avec Supabase directement
  useEffect(() => {
    const verifySubscriptionWithSupabase = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (session) {
          // Essayer d'abord une requête directe pour éviter les problèmes de typage avec RPC
          const userData = await supabase
            .from('user_balances')
            .select('subscription')
            .eq('id', session.user.id)
            .single();
            
          if (userData.data && userData.data.subscription) {
            // Si le retour est "alpha", le remplacer par "starter" pour la migration
            const mappedSubscription = userData.data.subscription === "alpha" ? "starter" : userData.data.subscription;
            setVerifiedSubscription(mappedSubscription);
            // Force la mise à jour du localStorage pour cohérence
            if (mappedSubscription !== localStorage.getItem('subscription')) {
              localStorage.setItem('subscription', mappedSubscription);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'abonnement:", error);
      }
    };
    
    // Si l'état local et les props diffèrent, vérifier avec Supabase
    if (currentSubscription !== verifiedSubscription) {
      verifySubscriptionWithSupabase();
    } else if (currentSubscription === "alpha") {
      // Si l'abonnement est "alpha", le convertir en "starter"
      setVerifiedSubscription("starter");
      localStorage.setItem('subscription', "starter");
    } else {
      setVerifiedSubscription(currentSubscription);
    }
  }, [currentSubscription, verifiedSubscription]);

  // Fonction pour obtenir le nom d'affichage de l'abonnement
  const getDisplayName = (code: string): string => {
    const names: Record<string, string> = {
      'freemium': 'Freemium',
      'starter': 'Starter',
      'gold': 'Gold',
      'elite': 'Élite Premium'
    };
    return names[code] || code.charAt(0).toUpperCase() + code.slice(1);
  };
  
  // Fonction pour obtenir la couleur de fond selon l'abonnement
  const getGradient = (sub: string): string => {
    switch (sub) {
      case 'freemium':
        return 'from-blue-900/50 to-blue-800/50';
      case 'starter':
        return 'from-indigo-900/60 to-indigo-700/60';
      case 'gold':
        return 'from-purple-900/60 to-purple-700/60';
      case 'elite':
        return 'from-violet-900/70 via-fuchsia-800/60 to-violet-700/70';
      default:
        return 'from-blue-900/50 to-blue-800/50';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center mt-4">
        <div className="p-4 bg-gradient-to-r from-slate-800/70 to-slate-700/70 rounded-lg shadow-inner flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-blue-200 font-medium">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }
  
  // Convertir les abonnements "alpha" en "starter" pour l'affichage
  const displaySubscription = (verifiedSubscription === "alpha" ? "starter" : verifiedSubscription) || currentSubscription;
  
  if (displaySubscription && displaySubscription !== 'freemium') {
    // Version spéciale pour Élite avec animation et effets visuels plus marqués
    if (displaySubscription === 'elite') {
      return (
        <div className="mt-6 p-4 bg-gradient-to-r from-violet-900/80 via-fuchsia-800/70 to-violet-700/80 rounded-lg shadow-inner border border-purple-400/20 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZtMyAzbS02IDBoLTZtMTIgMGgtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="absolute top-0 right-0 opacity-20">
            <svg width="86" height="86" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43 0L50.5 36.5L86 43L50.5 50.5L43 86L36.5 50.5L0 43L36.5 36.5L43 0Z" fill="white"/>
            </svg>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-200 font-bold text-lg">Abonnement</span>
                <span className="text-white font-bold text-xl flex items-center">
                  <Crown className="h-4 w-4 mr-1 text-purple-100" />
                  Élite Premium
                  <Sparkles className="h-4 w-4 ml-1 text-purple-200 animate-pulse" />
                </span>
              </div>
              <p className="text-purple-200 text-sm mt-1">
                Accès illimité à toutes les fonctionnalités premium et exclusives
              </p>
            </div>
            <div className="flex items-center bg-violet-800/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-purple-500/30">
              <Zap className="h-4 w-4 text-purple-200 mr-1.5" />
              <span className="text-white font-semibold">50€/jour</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Version standard pour les autres abonnements
    return (
      <div className={`mt-6 p-4 bg-gradient-to-r ${getGradient(displaySubscription)} rounded-lg shadow-inner border border-white/10 animate-fadeIn relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/5 to-transparent opacity-60"></div>
        <p className="text-[#a0e4ff] font-semibold relative z-10">
          Votre abonnement actuel: <span className="text-white font-bold ml-1">
            {getDisplayName(displaySubscription)}
          </span>
        </p>
      </div>
    );
  } else if (displaySubscription === 'freemium') {
    return (
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-800/70 to-gray-700/70 rounded-lg shadow-inner border border-gray-600/30">
        <p className="text-gray-300 font-medium">
          Vous utilisez actuellement la version <span className="text-gray-100 font-semibold">Freemium</span>
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Découvrez nos offres payantes pour augmenter vos gains quotidiens.
        </p>
      </div>
    );
  }
  
  return null;
};

export default SubscriptionStatusIndicator;

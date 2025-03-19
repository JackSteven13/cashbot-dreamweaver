
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Essayer d'abord la fonction RPC pour une récupération fiable
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_current_subscription', { 
              user_id: session.user.id 
            }, {
              head: false, // Contourner le cache
              count: 'exact' as const
            }) as { data: string | null, error: any };
            
          if (!rpcError && rpcData) {
            setVerifiedSubscription(rpcData);
            // Force la mise à jour du localStorage pour cohérence
            if (rpcData !== localStorage.getItem('subscription')) {
              localStorage.setItem('subscription', rpcData);
            }
          } else {
            // Fallback sur requête directe
            const { data: userData, error: directError } = await supabase
              .from('user_balances')
              .select('subscription')
              .eq('id', session.user.id)
              .single();
              
            if (!directError && userData && userData.subscription) {
              setVerifiedSubscription(userData.subscription);
              // Force aussi la mise à jour du localStorage
              if (userData.subscription !== localStorage.getItem('subscription')) {
                localStorage.setItem('subscription', userData.subscription);
              }
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
    } else {
      setVerifiedSubscription(currentSubscription);
    }
  }, [currentSubscription]);

  // Fonction pour obtenir le nom d'affichage de l'abonnement
  const getDisplayName = (code: string): string => {
    const names: Record<string, string> = {
      'freemium': 'Freemium',
      'pro': 'Pro',
      'visionnaire': 'Visionnaire',
      'alpha': 'Alpha'
    };
    return names[code] || code.charAt(0).toUpperCase() + code.slice(1);
  };
  
  // Fonction pour obtenir la couleur de fond selon l'abonnement
  const getGradient = (sub: string): string => {
    switch (sub) {
      case 'freemium':
        return 'from-blue-900/50 to-blue-800/50';
      case 'pro':
        return 'from-indigo-900/60 to-indigo-700/60';
      case 'visionnaire':
        return 'from-purple-900/60 to-purple-700/60';
      case 'alpha':
        return 'from-violet-900/70 to-violet-700/70';
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
  
  const displaySubscription = verifiedSubscription || currentSubscription;
  
  if (displaySubscription && displaySubscription !== 'freemium') {
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

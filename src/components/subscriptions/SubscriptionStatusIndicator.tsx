
import React from 'react';
import { Loader2 } from 'lucide-react';

interface SubscriptionStatusIndicatorProps {
  isLoading: boolean;
  currentSubscription: string | null;
}

const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({
  isLoading,
  currentSubscription
}) => {
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
  
  if (currentSubscription && currentSubscription !== 'freemium') {
    return (
      <div className="mt-6 p-4 bg-gradient-to-r rounded-lg shadow-inner border border-white/10 animate-fadeIn relative overflow-hidden"
           className={`mt-6 p-4 bg-gradient-to-r ${getGradient(currentSubscription)} rounded-lg shadow-inner border border-white/10`}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/5 to-transparent opacity-60"></div>
        <p className="text-[#a0e4ff] font-semibold relative z-10">
          Votre abonnement actuel: <span className="text-white font-bold ml-1">
            {getDisplayName(currentSubscription)}
          </span>
        </p>
      </div>
    );
  } else if (currentSubscription === 'freemium') {
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

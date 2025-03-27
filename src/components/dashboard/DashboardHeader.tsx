
import React, { useMemo } from 'react';

interface DashboardHeaderProps {
  username: string;
  subscription: string;
}

const DashboardHeader = ({ username, subscription }: DashboardHeaderProps) => {
  // Amélioré pour être plus robuste et stable
  const displayName = useMemo(() => {
    // Gestion spéciale pour ce compte
    if (username === "kayzerslotern@gmail.com") {
      return "Dickerson";
    }
    
    // Nettoyage du nom avec remplacement par défaut
    if (!username || username.trim() === '') {
      return 'Utilisateur';
    }
    
    // Limiter la longueur pour éviter les problèmes d'affichage
    const cleanName = username.trim();
    return cleanName.length > 20 ? cleanName.substring(0, 20) + '...' : cleanName;
  }, [username]);
  
  // Format the subscription display
  const formattedSubscription = useMemo(() => {
    const subscriptions = {
      'freemium': 'Freemium',
      'pro': 'Pro',
      'visionnaire': 'Visionnaire',
      'alpha': 'Alpha Premium'
    };
    
    return subscriptions[subscription as keyof typeof subscriptions] || subscription;
  }, [subscription]);
  
  return (
    <header className="sticky top-0 z-10 bg-[#1e3a5f] border-b border-[#2d5f8a]/30">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-white">
          {`Bonjour, ${displayName}`}
        </h1>
        
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-white">{displayName}</p>
          <p className="text-blue-200">Abonnement {formattedSubscription}</p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

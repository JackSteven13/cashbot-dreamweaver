
import React, { useMemo } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { User, ChevronDown } from 'lucide-react';

interface DashboardHeaderProps {
  username: string;
  subscription: string;
}

const DashboardHeader = ({ username, subscription }: DashboardHeaderProps) => {
  // Simplifié pour traiter tous les utilisateurs de la même façon
  const displayName = useMemo(() => {
    // Nettoyage du nom avec remplacement par défaut
    if (!username || username.trim() === '') {
      return 'Utilisateur';
    }
    
    // Limiter la longueur pour éviter les problèmes d'affichage
    const cleanName = username.trim();
    return cleanName.length > 20 ? cleanName.substring(0, 20) + '...' : cleanName;
  }, [username]);

  // Convertir "alpha" en "starter" pour l'affichage
  const displaySubscription = subscription === "alpha" ? "starter" : subscription || "freemium";
  
  return (
    <header className="sticky top-0 z-10 bg-[#1e3a5f] border-b border-[#2d5f8a]/30">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-white">
          {`Bonjour, ${displayName}`}
        </h1>
        
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-white">{displayName}</p>
          <p className="text-blue-200">Abonnement {displaySubscription || 'freemium'}</p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

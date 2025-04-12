
import React, { useMemo, useEffect, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { User, ChevronDown } from 'lucide-react';

interface DashboardHeaderProps {
  username: string;
  subscription: string;
}

const DashboardHeader = ({ username, subscription }: DashboardHeaderProps) => {
  // État pour le nom utilisateur avec mécanisme de persistance local
  const [displayName, setDisplayName] = useState<string>(() => {
    // Essayer de récupérer le nom sauvegardé au premier rendu
    return localStorage.getItem('lastKnownUsername') || 'Utilisateur';
  });
  
  // Mettre à jour le nom affiché quand username change
  useEffect(() => {
    // Vérifier si le nom d'utilisateur est valide
    if (username && username !== 'Utilisateur') {
      setDisplayName(username);
      
      // Sauvegarder dans le localStorage pour persistance
      try {
        localStorage.setItem('lastKnownUsername', username);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde du nom d'utilisateur:", error);
      }
    }
  }, [username]);

  // Nettoyer et formater le nom affiché
  const formattedName = useMemo(() => {
    // Limiter la longueur pour éviter les problèmes d'affichage
    const cleanName = displayName?.trim() || 'Utilisateur';
    return cleanName.length > 20 ? cleanName.substring(0, 20) + '...' : cleanName;
  }, [displayName]);

  // Convertir "alpha" en "starter" pour l'affichage
  const displaySubscription = subscription === "alpha" ? "starter" : subscription || "freemium";
  
  return (
    <header className="sticky top-0 z-10 bg-[#1e3a5f] border-b border-[#2d5f8a]/30">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold text-white">
          {`Bonjour, ${formattedName}`}
        </h1>
        
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-white">{formattedName}</p>
          <p className="text-blue-200">Abonnement {displaySubscription || 'freemium'}</p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

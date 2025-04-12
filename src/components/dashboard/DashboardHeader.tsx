
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { animateBalanceUpdate } from '@/utils/animations/animateBalanceUpdate';

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
  
  // Référence pour éviter les mises à jour inutiles
  const initialNameSet = useRef(false);
  
  // Mettre à jour le nom affiché quand username change, mais plus intelligemment
  useEffect(() => {
    // Vérifier si le nom d'utilisateur est valide
    if (username && username !== 'Utilisateur' && !initialNameSet.current) {
      initialNameSet.current = true;
      setDisplayName(username);
      
      // Sauvegarder dans le localStorage pour persistance
      try {
        localStorage.setItem('lastKnownUsername', username);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde du nom d'utilisateur:", error);
      }
    }
  }, [username]);

  // État pour l'animation du solde
  const [animatedBalance, setAnimatedBalance] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Écouter les événements de mise à jour du solde
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      
      if (amount > 0 || (currentBalance !== undefined && currentBalance > 0)) {
        setIsAnimating(true);
        
        // Utiliser la fonction d'animation pour le solde
        animateBalanceUpdate(
          animatedBalance || 0,
          currentBalance || (animatedBalance || 0) + amount,
          1500, // durée de l'animation
          (value) => setAnimatedBalance(value),
          undefined,
          () => setIsAnimating(false)
        );
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleBalanceUpdate);
    };
  }, [animatedBalance]);

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
        <h1 className="text-xl font-semibold text-white truncate">
          {`Bonjour, ${formattedName}`}
        </h1>
        
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-white truncate">{formattedName}</p>
          <p className="text-blue-200">Abonnement {displaySubscription || 'freemium'}</p>
          {animatedBalance !== null && (
            <p className={`text-blue-100 font-medium transition-colors ${isAnimating ? 'text-green-300' : ''}`}>
              {animatedBalance.toFixed(2)}€
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

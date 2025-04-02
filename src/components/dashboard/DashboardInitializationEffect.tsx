
import { useEffect, useRef } from 'react';

interface DashboardInitializationEffectProps {
  initialRenderComplete: React.MutableRefObject<boolean>;
  isAuthChecking: boolean;
  isLoading: boolean;
  userData: any;
  pathname: string;
  setSelectedNavItem: (navItem: string) => void;
}

const DashboardInitializationEffect: React.FC<DashboardInitializationEffectProps> = ({
  initialRenderComplete,
  isAuthChecking,
  isLoading,
  userData,
  pathname,
  setSelectedNavItem
}) => {
  const initEffectRan = useRef(false);
  const navEffectRan = useRef(false);

  // Effet d'initialisation stabilisé avec vérifications de dépendances stables
  useEffect(() => {
    // Prévenir les exécutions multiples
    if (!initEffectRan.current && !initialRenderComplete.current) {
      // Vérifier que toutes les données sont disponibles avant de marquer l'initialisation
      if (!isAuthChecking && !isLoading && userData && userData.username) {
        console.log("Dashboard monté avec les données utilisateur:", userData.username);
        initialRenderComplete.current = true;
        initEffectRan.current = true;
      }
    }
    
    // Nettoyage unifié
    return () => {
      console.log("Nettoyage de l'effet d'initialisation du dashboard");
    };
    // Dépendances simplifiées pour éviter les boucles
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effet de navigation simplifié et stabilisé
  useEffect(() => {
    // Mise à jour de l'élément de navigation sélectionné uniquement si nécessaire
    if (pathname === "/dashboard" && !navEffectRan.current) {
      setSelectedNavItem('dashboard');
      navEffectRan.current = true;
    }
    
    // Réinitialisation lors du démontage
    return () => {
      navEffectRan.current = false;
    };
    // Dépendances minimales pour éviter les boucles
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

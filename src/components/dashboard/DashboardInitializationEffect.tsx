
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

  // Effet d'initialisation consolidé et stabilisé
  useEffect(() => {
    // Si l'initialisation n'a pas encore été complétée
    if (!initEffectRan.current && !initialRenderComplete.current) {
      // Vérifier que toutes les données sont disponibles avant de marquer l'initialisation
      if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
        console.log("Dashboard monté avec les données utilisateur:", userData.username);
        initialRenderComplete.current = true;
        initEffectRan.current = true;
      }
    }
    
    // Nettoyage unifié
    return () => {
      console.log("Nettoyage de l'effet d'initialisation du dashboard");
    };
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effet de navigation simplifié
  useEffect(() => {
    // Mise à jour de l'élément de navigation sélectionné
    if (pathname === "/dashboard" && !navEffectRan.current) {
      setSelectedNavItem('dashboard');
      navEffectRan.current = true;
    }
    
    // Réinitialisation lors du démontage
    return () => {
      navEffectRan.current = false;
    };
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

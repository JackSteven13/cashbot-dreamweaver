
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

  // Stabiliser l'effet d'initialisation avec des dépendances minimales
  useEffect(() => {
    // Ne s'exécuter qu'une fois lors du montage initial
    if (!initEffectRan.current && !initialRenderComplete.current) {
      // Attendre que toutes les données soient disponibles
      if (!isAuthChecking && !isLoading && userData && userData.username) {
        console.log("Dashboard initialement monté avec données utilisateur:", userData.username);
        initialRenderComplete.current = true;
        initEffectRan.current = true;
      }
    }
    
    // Nettoyage
    return () => {
      // Ne rien faire au démontage pour éviter les réinitialisations
    };
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effet de navigation séparé et isolé
  useEffect(() => {
    if (pathname === "/dashboard" && !navEffectRan.current) {
      setSelectedNavItem('dashboard');
      navEffectRan.current = true;
    }
    
    return () => {
      // Réinitialiser seulement lors du démontage complet
      if (pathname !== "/dashboard") {
        navEffectRan.current = false;
      }
    };
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

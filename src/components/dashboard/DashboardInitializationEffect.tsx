
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

  // Effet pour logging initial - optimisé pour éviter les doubles exécutions
  useEffect(() => {
    if (initEffectRan.current) return;
    
    // Vérifier que toutes les données sont disponibles avant de marquer l'initialisation
    if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard monté avec les données utilisateur:", userData.username);
      initialRenderComplete.current = true;
      initEffectRan.current = true;
    }
    
    // Nettoyer lors du démontage
    return () => {
      console.log("Nettoyage de l'effet d'initialisation du dashboard");
    };
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effet pour définir l'élément de navigation sélectionné en fonction du chemin
  useEffect(() => {
    if (navEffectRan.current) return;
    
    if (pathname === "/dashboard") {
      setSelectedNavItem('dashboard');
      navEffectRan.current = true;
    }
    
    return () => {
      navEffectRan.current = false;
    };
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

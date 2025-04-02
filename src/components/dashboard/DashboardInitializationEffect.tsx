
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

  // Effect pour logging initial - optimisé pour éviter les doubles exécutions
  useEffect(() => {
    if (initEffectRan.current) return;
    
    // Vérifier que toutes les données sont disponibles avant de marquer l'initialisation
    if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard monté avec les données utilisateur:", userData.username);
      initialRenderComplete.current = true;
      initEffectRan.current = true;
    }
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effect pour définir l'élément de navigation sélectionné en fonction du chemin
  useEffect(() => {
    if (pathname === "/dashboard") {
      setSelectedNavItem('dashboard');
    }
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;


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

  // Init effect - FIXED: no early returns that could skip cleanup
  useEffect(() => {
    // Instead of returning early, use a condition to execute the initialization code
    if (!initEffectRan.current) {
      // Vérifier que toutes les données sont disponibles avant de marquer l'initialisation
      if (!isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
        console.log("Dashboard monté avec les données utilisateur:", userData.username);
        initialRenderComplete.current = true;
        initEffectRan.current = true;
      }
    }
    
    // Always include the cleanup function
    return () => {
      console.log("Nettoyage de l'effet d'initialisation du dashboard");
    };
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Navigation effect - FIXED: no early returns that could skip cleanup
  useEffect(() => {
    // Instead of returning early, use a condition to execute the code
    if (!navEffectRan.current) {
      if (pathname === "/dashboard") {
        setSelectedNavItem('dashboard');
        navEffectRan.current = true;
      }
    }
    
    // Always include the cleanup function
    return () => {
      navEffectRan.current = false;
    };
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;


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

  // Effet d'initialisation unique et simplifié
  useEffect(() => {
    if (!initEffectRan.current && !initialRenderComplete.current) {
      if (!isAuthChecking && !isLoading && userData && userData.username) {
        console.log("Dashboard initialement monté avec données utilisateur:", userData.username);
        initialRenderComplete.current = true;
        initEffectRan.current = true;
      }
    }
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effet de navigation simplifié et indépendant
  useEffect(() => {
    if (pathname === "/dashboard" && !navEffectRan.current) {
      setSelectedNavItem('dashboard');
      navEffectRan.current = true;
    }
    
    return () => {
      if (pathname !== "/dashboard") {
        navEffectRan.current = false;
      }
    };
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

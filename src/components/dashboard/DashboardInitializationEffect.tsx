
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
  // Utiliser des références stables pour éviter les renders en cascade
  const stablePathRef = useRef(pathname);
  const initializationDone = useRef(false);
  const navigationDone = useRef(false);
  
  useEffect(() => {
    stablePathRef.current = pathname;
  }, [pathname]);

  // Initialization effect - runs once only
  useEffect(() => {
    if (!initializationDone.current && !initialRenderComplete.current) {
      if (!isAuthChecking && !isLoading && userData && userData.username) {
        console.log("Dashboard initially mounted with user data:", userData.username);
        initialRenderComplete.current = true;
        initializationDone.current = true;
      }
    }
    
    // Cleanup function
    return () => {
      // Ne pas réinitialiser initialRenderComplete car c'est une ref externe
    };
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Separate navigation effect - isolated to prevent conflicts
  useEffect(() => {
    const currentPath = stablePathRef.current;
    
    // Only run when path is dashboard and not already done
    if (currentPath === "/dashboard" && !navigationDone.current) {
      console.log("Setting selected nav item to dashboard");
      setSelectedNavItem('dashboard');
      navigationDone.current = true;
    }
    
    // Reset navigation flag when path changes away from dashboard
    return () => {
      if (stablePathRef.current !== "/dashboard") {
        navigationDone.current = false;
      }
    };
  }, [setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

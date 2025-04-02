
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

  // Initialization effect - runs once only
  useEffect(() => {
    if (!initEffectRan.current && !initialRenderComplete.current) {
      if (!isAuthChecking && !isLoading && userData && userData.username) {
        console.log("Dashboard initially mounted with user data:", userData.username);
        initialRenderComplete.current = true;
        initEffectRan.current = true;
      }
    }
    
    // No cleanup or dependencies that could cause re-runs
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Navigation effect - separated for clarity
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

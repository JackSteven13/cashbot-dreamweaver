
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
  const effectsAppliedRef = useRef({
    initialization: false,
    navigation: false
  });

  // Initialization effect - runs once only
  useEffect(() => {
    if (!effectsAppliedRef.current.initialization && !initialRenderComplete.current) {
      if (!isAuthChecking && !isLoading && userData && userData.username) {
        console.log("Dashboard initially mounted with user data:", userData.username);
        initialRenderComplete.current = true;
        effectsAppliedRef.current.initialization = true;
      }
    }
    
    // No cleanup needed as this runs once only
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Separate navigation effect to avoid conflicts
  useEffect(() => {
    // Only run once per dashboard visit
    if (pathname === "/dashboard" && !effectsAppliedRef.current.navigation) {
      console.log("Setting selected nav item to dashboard");
      setSelectedNavItem('dashboard');
      effectsAppliedRef.current.navigation = true;
    }
    
    // Reset navigation flag when path changes
    return () => {
      if (pathname !== "/dashboard") {
        effectsAppliedRef.current.navigation = false;
      }
    };
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

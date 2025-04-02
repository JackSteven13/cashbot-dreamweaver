
import { useEffect } from 'react';

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
  // Effect for logging initial render
  useEffect(() => {
    // Only log on first successful render with data
    if (!initialRenderComplete.current && !isAuthChecking && !isLoading && userData && userData.balance !== undefined) {
      console.log("Dashboard mounted with user data:", userData.username);
      initialRenderComplete.current = true;
    }
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effect for setting selected nav item based on pathname
  useEffect(() => {
    if (pathname === "/dashboard") {
      setSelectedNavItem('dashboard');
    }
  }, [pathname, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

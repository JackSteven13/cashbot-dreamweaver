
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useDashboardNavigation = () => {
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  const location = useLocation();

  // Update selected nav item based on URL
  useEffect(() => {
    if (location.pathname === "/dashboard") {
      setSelectedNavItem('dashboard');
    }
  }, [location.pathname]);

  return {
    selectedNavItem,
    setSelectedNavItem
  };
};

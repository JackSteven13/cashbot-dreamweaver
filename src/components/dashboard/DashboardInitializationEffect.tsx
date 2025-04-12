
import { useEffect, useRef, useState } from 'react';

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
  // État pour suivre le statut d'initialisation
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Références stables pour éviter les changements de dépendances
  const stablePathRef = useRef(pathname);
  const initializationDone = useRef(false);
  const navigationDone = useRef(false);
  
  // Mettre à jour la référence du chemin de façon stable
  useEffect(() => {
    stablePathRef.current = pathname;
  }, [pathname]);

  // Effet d'initialisation unique - exécuté une seule fois
  useEffect(() => {
    if (initializationDone.current) {
      return;
    }
    
    // Forcer l'initialisation après un court délai même si les conditions ne sont pas idéales
    const forceInitTimer = setTimeout(() => {
      if (!initializationDone.current) {
        console.log("Forçage de l'initialisation après délai");
        initialRenderComplete.current = true;
        initializationDone.current = true;
        setIsInitialized(true);
        
        // Définir la navigation en fonction du chemin actuel
        if (pathname.includes('referrals')) {
          setSelectedNavItem('referrals');
        } else if (pathname.includes('transactions')) {
          setSelectedNavItem('transactions');
        } else {
          setSelectedNavItem('dashboard');
        }
      }
    }, 500);
    
    // Si les données utilisateur sont disponibles, initialiser immédiatement
    if (userData && !isAuthChecking) {
      clearTimeout(forceInitTimer);
      console.log("Initialisation du dashboard avec les données utilisateur");
      initialRenderComplete.current = true;
      initializationDone.current = true;
      setIsInitialized(true);
      
      // Définir la navigation en fonction du chemin actuel
      if (pathname.includes('referrals')) {
        setSelectedNavItem('referrals');
      } else if (pathname.includes('transactions')) {
        setSelectedNavItem('transactions');
      } else {
        setSelectedNavItem('dashboard');
      }
    }
    
    return () => clearTimeout(forceInitTimer);
  }, [initialRenderComplete, isAuthChecking, userData, pathname, setSelectedNavItem]);

  // Effet de navigation isolé - s'exécute uniquement lorsque l'initialisation est terminée
  useEffect(() => {
    // Ne pas exécuter avant l'initialisation
    if (!isInitialized) return;
    
    if (!navigationDone.current) {
      navigationDone.current = true;
      
      if (stablePathRef.current.includes('/referrals')) {
        setSelectedNavItem('referrals');
      } else if (stablePathRef.current.includes('/transactions')) {
        setSelectedNavItem('transactions');
      } else {
        setSelectedNavItem('dashboard');
      }
    }
    
    // Réinitialiser le flag de navigation lorsque le chemin change
    return () => {
      if (stablePathRef.current !== pathname) {
        navigationDone.current = false;
      }
    };
  }, [isInitialized, pathname, setSelectedNavItem]);

  return null; // Composant sans rendu visuel
};

export default DashboardInitializationEffect;

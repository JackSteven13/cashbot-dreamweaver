
import { useEffect, useRef, useState } from 'react';

interface DashboardInitializationEffectProps {
  initialRenderComplete: React.MutableRefObject<boolean>;
  isAuthChecking: boolean;
  isLoading: boolean;
  userData: any;
  pathname: string;
  setSelectedNavItem: (navItem: string) => void;
}

/**
 * Composant d'effet pour l'initialisation du dashboard
 * Restructuré pour éviter les re-rendus en cascade et les boucles infinies
 */
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
  const initializationAttempted = useRef(false);
  const maxInitializationAttempts = useRef(0);
  
  // Mettre à jour la référence du chemin de façon stable
  useEffect(() => {
    stablePathRef.current = pathname;
  }, [pathname]);

  // Effet d'initialisation - exécuté une seule fois avec protection contre les boucles
  useEffect(() => {
    // Ne pas réinitialiser plusieurs fois dans la même session
    if (initializationDone.current) {
      console.log("Initialisation déjà terminée, ignoré");
      return;
    }
    
    // Protection contre les tentatives infinies
    if (maxInitializationAttempts.current > 5) {
      console.log("Trop de tentatives d'initialisation, on force l'initialisation");
      initialRenderComplete.current = true;
      initializationDone.current = true;
      setIsInitialized(true);
      return;
    }
    
    // Marquer que nous avons tenté l'initialisation
    initializationAttempted.current = true;
    maxInitializationAttempts.current++;
    
    // L'initialisation n'est sécuritaire que lorsque nous avons les données utilisateur
    if (!isAuthChecking && !isLoading && userData && userData.username) {
      console.log("Initialisation du dashboard avec les données utilisateur:", userData.username);
      
      // Marquer l'initialisation comme complète
      initialRenderComplete.current = true;
      initializationDone.current = true;
      setIsInitialized(true);
      
      // Force la sélection du bon élément dans la navigation
      if (pathname.includes('referrals')) {
        setSelectedNavItem('referrals');
      } else if (pathname.includes('transactions')) {
        setSelectedNavItem('transactions');
      } else {
        setSelectedNavItem('dashboard');
      }
    } else {
      // Si les conditions ne sont pas remplies, on programme une nouvelle tentative
      setTimeout(() => {
        console.log("Nouvelle tentative d'initialisation...");
      }, 500); 
    }
    
    // Définir un délai pour forcer l'initialisation après un certain temps
    const forceInitTimeout = setTimeout(() => {
      if (!initializationDone.current) {
        console.log("Forçage de l'initialisation après timeout");
        initialRenderComplete.current = true;
        initializationDone.current = true;
        setIsInitialized(true);
      }
    }, 3000); // 3 secondes maximum
    
    return () => clearTimeout(forceInitTimeout);
  }, [isAuthChecking, isLoading, userData, initialRenderComplete, pathname, setSelectedNavItem]);

  // Effet de navigation isolé - s'exécute uniquement lorsque l'initialisation est terminée
  useEffect(() => {
    // Ne pas exécuter avant l'initialisation pour éviter les conflits
    if (!isInitialized) return;
    
    const currentPath = stablePathRef.current;
    
    // Exécuter uniquement lorsque le chemin est dashboard et pas déjà fait
    if (currentPath.includes('/dashboard') && !navigationDone.current) {
      // Utiliser setTimeout pour décaler l'exécution et éviter les conflits avec d'autres effets
      const timerId = setTimeout(() => {
        if (userData && userData.username) {
          console.log("Définition de l'élément de navigation sélectionné selon le chemin");
          
          if (currentPath.includes('/referrals')) {
            setSelectedNavItem('referrals');
          } else if (currentPath.includes('/transactions')) {
            setSelectedNavItem('transactions');
          } else {
            setSelectedNavItem('dashboard');
          }
          
          navigationDone.current = true;
        }
      }, 100);
      
      return () => clearTimeout(timerId);
    }
    
    // Réinitialiser le flag de navigation lorsque le chemin change
    if (stablePathRef.current !== currentPath) {
      navigationDone.current = false;
    }
  }, [isInitialized, userData, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

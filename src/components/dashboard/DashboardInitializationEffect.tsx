
import { useEffect, useRef } from 'react';

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
  // Références stables pour éviter les changements de dépendances
  const stablePathRef = useRef(pathname);
  const initializationDone = useRef(false);
  const navigationDone = useRef(false);
  const safeToInitialize = useRef(true);
  
  // Mettre à jour la référence du chemin de façon stable
  useEffect(() => {
    stablePathRef.current = pathname;
  }, [pathname]);

  // Effet d'initialisation - exécuté une seule fois avec protection contre les boucles
  useEffect(() => {
    // Vérifier si l'initialisation a déjà été faite ou si nous sommes dans un état transitoire
    if (!safeToInitialize.current || initializationDone.current) {
      return;
    }
    
    // L'initialisation n'est sécuritaire que lorsque nous avons les données utilisateur
    // ET que les chargements initiaux sont terminés
    if (!isAuthChecking && !isLoading && userData && userData.username) {
      console.log("Initialisation du dashboard avec les données utilisateur:", userData.username);
      
      // Marquer l'initialisation comme complète pour éviter de futurs re-rendus
      initialRenderComplete.current = true;
      initializationDone.current = true;
      
      // Éviter toute autre tentative d'initialisation
      safeToInitialize.current = false;
      
      // Définir un délai pour réinitialiser le flag afin de permettre une actualisation future si nécessaire
      setTimeout(() => {
        safeToInitialize.current = true;
      }, 5000);
    }
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effet de navigation isolé - pour éviter les conflits avec l'initialisation
  useEffect(() => {
    const currentPath = stablePathRef.current;
    
    // Exécuter uniquement lorsque le chemin est dashboard et pas déjà fait
    if (currentPath === "/dashboard" && !navigationDone.current) {
      // Utiliser setTimeout pour décaler l'exécution et éviter les conflits avec d'autres effets
      const timerId = setTimeout(() => {
        if (userData && userData.username) {
          console.log("Définition de l'élément de navigation sélectionné sur dashboard");
          setSelectedNavItem('dashboard');
          navigationDone.current = true;
        }
      }, 100);
      
      return () => clearTimeout(timerId);
    }
    
    // Réinitialiser le flag de navigation lorsque le chemin change
    return () => {
      if (stablePathRef.current !== "/dashboard") {
        navigationDone.current = false;
      }
    };
  }, [setSelectedNavItem, userData]);

  return null;
};

export default DashboardInitializationEffect;

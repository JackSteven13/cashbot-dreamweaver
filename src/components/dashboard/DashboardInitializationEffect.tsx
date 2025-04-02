
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
  
  // Mettre à jour la référence du chemin de façon stable
  useEffect(() => {
    stablePathRef.current = pathname;
  }, [pathname]);

  // Effet d'initialisation - exécuté une seule fois avec protection contre les boucles
  useEffect(() => {
    // Ne jamais réinitialiser si déjà fait
    if (initializationDone.current || initializationAttempted.current) {
      return;
    }
    
    // Marquer que nous avons tenté l'initialisation pour éviter les tentatives multiples
    initializationAttempted.current = true;
    
    // L'initialisation n'est sécuritaire que lorsque nous avons les données utilisateur
    // ET que les chargements initiaux sont terminés
    if (!isAuthChecking && !isLoading && userData && userData.username) {
      console.log("Initialisation du dashboard avec les données utilisateur:", userData.username);
      
      // Marquer l'initialisation comme complète pour éviter de futurs re-rendus
      initialRenderComplete.current = true;
      initializationDone.current = true;
      setIsInitialized(true);
      
      // Définir un délai pour réinitialiser le flag d'initialisation après un certain temps
      // pour permettre une potentielle réinitialisation future
      setTimeout(() => {
        initializationAttempted.current = false;
      }, 30000); // 30 secondes
    }
  }, [isAuthChecking, isLoading, userData, initialRenderComplete]);

  // Effet de navigation isolé - s'exécute uniquement lorsque l'initialisation est terminée
  useEffect(() => {
    // Ne pas exécuter avant l'initialisation pour éviter les conflits
    if (!isInitialized) return;
    
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
  }, [isInitialized, userData, setSelectedNavItem]);

  return null;
};

export default DashboardInitializationEffect;

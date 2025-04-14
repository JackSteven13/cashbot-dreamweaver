
import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

interface UserDataStateTrackerProps {
  onUsernameLoaded?: (username: string) => void;
  onDataRefreshed?: (data: any) => void;
  onSyncError?: (error: string) => void;
}

// Composant invisible pour suivre les événements liés aux données utilisateur
const UserDataStateTracker = ({ 
  onUsernameLoaded,
  onDataRefreshed,
  onSyncError
}: UserDataStateTrackerProps) => {
  const toastShownRef = useRef<boolean>(false);
  const usernameLoadedRef = useRef<boolean>(false);
  
  // Écouteur pour le chargement du nom d'utilisateur
  useEffect(() => {
    const handleUsernameLoaded = (event: any) => {
      const username = event.detail?.username;
      if (username && !usernameLoadedRef.current) {
        console.log("Événement username:loaded reçu:", username);
        usernameLoadedRef.current = true;
        
        if (onUsernameLoaded) {
          onUsernameLoaded(username);
        }
      }
    };
    
    // Écouteur pour les données utilisateur rafraîchies
    const handleDataRefreshed = (event: any) => {
      console.log("Événement user:refreshed reçu:", event.detail);
      
      if (onDataRefreshed) {
        onDataRefreshed(event.detail);
      }
    };
    
    // Écouteur pour les erreurs de synchronisation
    const handleSyncError = (event: any) => {
      console.error("Événement user:sync-error reçu:", event.detail?.error);
      
      // Montrer un toast d'erreur seulement une fois
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        
        toast({
          title: "Problème de synchronisation",
          description: "Certaines données utilisateur n'ont pas pu être chargées. Veuillez rafraîchir la page ou réessayer plus tard.",
          variant: "destructive",
          duration: 5000
        });
      }
      
      if (onSyncError) {
        onSyncError(event.detail?.error);
      }
    };
    
    // Écouteur pour l'initialisation rapide
    const handleFastInit = (event: any) => {
      console.log("Événement user:fast-init reçu:", event.detail);
      
      const username = event.detail?.username;
      if (username && !usernameLoadedRef.current) {
        usernameLoadedRef.current = true;
        
        if (onUsernameLoaded) {
          onUsernameLoaded(username);
        }
      }
    };
    
    // Enregistrer les écouteurs d'événements
    window.addEventListener('username:loaded', handleUsernameLoaded);
    window.addEventListener('user:refreshed', handleDataRefreshed);
    window.addEventListener('user:sync-error', handleSyncError);
    window.addEventListener('user:fast-init', handleFastInit);
    
    // Vérifier s'il y a déjà un nom d'utilisateur dans le localStorage
    const cachedUsername = localStorage.getItem('lastKnownUsername');
    if (cachedUsername && !usernameLoadedRef.current) {
      console.log("Nom d'utilisateur trouvé dans localStorage:", cachedUsername);
      usernameLoadedRef.current = true;
      
      if (onUsernameLoaded) {
        onUsernameLoaded(cachedUsername);
      }
    }
    
    return () => {
      // Nettoyer les écouteurs d'événements
      window.removeEventListener('username:loaded', handleUsernameLoaded);
      window.removeEventListener('user:refreshed', handleDataRefreshed);
      window.removeEventListener('user:sync-error', handleSyncError);
      window.removeEventListener('user:fast-init', handleFastInit);
    };
  }, [onUsernameLoaded, onDataRefreshed, onSyncError]);
  
  // Ce composant ne rend rien, il est juste utilisé pour gérer les événements
  return null;
};

export default UserDataStateTracker;

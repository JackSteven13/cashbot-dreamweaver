
import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

interface UserDataStateTrackerProps {
  onUsernameLoaded?: (username: string) => void;
  onDataRefreshed?: (data: any) => void;
  onSyncError?: (error: string) => void;
}

// Component to track user data state events
const UserDataStateTracker = ({ 
  onUsernameLoaded,
  onDataRefreshed,
  onSyncError
}: UserDataStateTrackerProps) => {
  const usernameSentRef = useRef(false);
  const errorNotifiedRef = useRef(false);
  
  // Listen for username loaded events
  useEffect(() => {
    const handleUsernameLoaded = (event: any) => {
      const username = event.detail?.username;
      if (username && !usernameSentRef.current && onUsernameLoaded) {
        console.log("Username loaded event received:", username);
        usernameSentRef.current = true;
        onUsernameLoaded(username);
      }
    };
    
    // Listen for data refreshed events
    const handleDataRefreshed = (event: any) => {
      console.log("Data refreshed event received:", event.detail);
      
      if (onDataRefreshed) {
        onDataRefreshed(event.detail);
      }
      
      // Also check for username in refreshed data
      const username = event.detail?.username;
      if (username && !usernameSentRef.current && onUsernameLoaded) {
        usernameSentRef.current = true;
        onUsernameLoaded(username);
      }
    };
    
    // Listen for sync error events
    const handleSyncError = (event: any) => {
      const errorMessage = event.detail?.error;
      console.error("Sync error event received:", errorMessage);
      
      // Show toast only once
      if (!errorNotifiedRef.current) {
        errorNotifiedRef.current = true;
        toast({
          title: "Problème de synchronisation",
          description: "Certaines données utilisateur n'ont pas pu être chargées. Veuillez rafraîchir la page.",
          variant: "destructive",
          duration: 5000
        });
      }
      
      if (onSyncError) {
        onSyncError(errorMessage);
      }
    };
    
    // Listen for initialization events
    const handleFastInit = (event: any) => {
      console.log("Fast initialization event received:", event.detail);
      
      // Check for username in fast init data
      const username = event.detail?.username;
      if (username && !usernameSentRef.current && onUsernameLoaded) {
        usernameSentRef.current = true;
        onUsernameLoaded(username);
      }
      
      if (onDataRefreshed) {
        onDataRefreshed(event.detail);
      }
    };
    
    // Check for cached username in localStorage
    const checkCachedUsername = () => {
      const cachedUsername = localStorage.getItem('lastKnownUsername');
      if (cachedUsername && !usernameSentRef.current && onUsernameLoaded) {
        console.log("Using cached username from localStorage:", cachedUsername);
        usernameSentRef.current = true;
        onUsernameLoaded(cachedUsername);
      }
    };
    
    // Register event listeners
    window.addEventListener('username:loaded', handleUsernameLoaded);
    window.addEventListener('user:refreshed', handleDataRefreshed);
    window.addEventListener('user:sync-error', handleSyncError);
    window.addEventListener('user:fast-init', handleFastInit);
    
    // Check for cached username
    checkCachedUsername();
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('username:loaded', handleUsernameLoaded);
      window.removeEventListener('user:refreshed', handleDataRefreshed);
      window.removeEventListener('user:sync-error', handleSyncError);
      window.removeEventListener('user:fast-init', handleFastInit);
    };
  }, [onUsernameLoaded, onDataRefreshed, onSyncError]);
  
  // Invisible component
  return null;
};

export default UserDataStateTracker;


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { cleanOtherUserData } from '@/utils/balance/balanceStorage';
import { clearUserData } from '@/utils/userSwitchGuard';

/**
 * Composant invisible qui gère la déconnexion et le nettoyage des données
 */
const LogoutHandler = () => {
  const router = useRouter();

  useEffect(() => {
    // Écouter les événements de déconnexion
    const handleLogout = async () => {
      try {
        // Nettoyer les données avant la déconnexion
        clearUserData();
        
        // Déconnexion de Supabase
        await supabase.auth.signOut();
        
        // Rediriger vers la page d'accueil
        router.push('/');
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };

    // Écouter les événements de déconnexion
    window.addEventListener('user:logout', handleLogout as any);
    
    // Au chargement initial, vérifier s'il y a un changement d'utilisateur
    const checkUserChange = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const currentUserId = session.user.id;
          const lastUserId = localStorage.getItem('lastKnownUserId');
          
          // Si l'ID utilisateur a changé, nettoyer les données des autres utilisateurs
          if (currentUserId !== lastUserId) {
            console.log(`User changed: ${lastUserId || 'none'} -> ${currentUserId}`);
            localStorage.setItem('lastKnownUserId', currentUserId);
            cleanOtherUserData(currentUserId);
          }
        }
      } catch (error) {
        console.error('Error checking user change:', error);
      }
    };
    
    checkUserChange();

    return () => {
      window.removeEventListener('user:logout', handleLogout as any);
    };
  }, [router]);

  return null;
};

export default LogoutHandler;

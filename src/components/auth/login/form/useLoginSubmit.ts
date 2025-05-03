
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";
import { getNetworkStatus, attemptNetworkRecovery } from '@/utils/auth/networkUtils';

export const useLoginSubmit = () => {
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent,
    email: string,
    password: string,
    setIsLoading: (isLoading: boolean) => void
  ) => {
    e.preventDefault();
    
    if (setIsLoading) {
      setIsLoading(true);
    }
    
    // Nettoyer complètement les données d'authentification stockées
    clearStoredAuthData();
    
    try {
      // Vérifier la connexion réseau et la résolution DNS
      const networkStatus = await getNetworkStatus();
      
      if (!networkStatus.isOnline) {
        throw new Error("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
      }
      
      if (!networkStatus.dnsWorking) {
        // Tentative de récupération réseau
        const recovered = await attemptNetworkRecovery();
        if (!recovered) {
          throw new Error("Problème de connexion au serveur. Vérifiez votre connexion ou réessayez plus tard.");
        }
      }
      
      // Variable pour suivre les tentatives
      let attemptCount = 0;
      let maxAttempts = 3;
      let authResult;
      let lastError = null;
      
      do {
        attemptCount++;
        console.log(`Tentative d'authentification ${attemptCount}/${maxAttempts}...`);
        
        try {
          // Tentative d'authentification avec Supabase
          authResult = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (!authResult.error) break;
          lastError = authResult.error;
          
          // Attendre brièvement entre les tentatives avec délai exponentiel
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 800 * attemptCount));
          }
        } catch (err) {
          console.error("Erreur lors de la tentative d'authentification:", err);
          lastError = err;
          
          // Attendre brièvement entre les tentatives
          if (attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 800 * attemptCount));
          }
        }
      } while (attemptCount < maxAttempts && (!authResult || authResult.error));
      
      // Si nous avons toujours une erreur après toutes les tentatives
      if (lastError || (authResult && authResult.error)) {
        throw lastError || authResult.error;
      }
      
      if (authResult?.data && authResult.data.user) {
        // Sauvegarder l'email pour les futures suggestions
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${authResult.data.user.user_metadata?.full_name || authResult.data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Mettre en place une double vérification de session
        setTimeout(async () => {
          try {
            // Vérifier que la session est bien établie avant de rediriger
            const { data: sessionCheck } = await supabase.auth.getSession();
            
            if (sessionCheck && sessionCheck.session) {
              // Session confirmée, rediriger
              navigate('/dashboard', { replace: true });
            } else {
              // Session non confirmée, essayer une nouvelle connexion
              console.log("Session non confirmée après connexion, nouvelle tentative...");
              const secondAttempt = await supabase.auth.signInWithPassword({
                email,
                password
              });
              
              if (!secondAttempt.error && secondAttempt.data.session) {
                navigate('/dashboard', { replace: true });
              } else {
                throw new Error("Échec de validation de session après connexion");
              }
            }
          } catch (sessionError) {
            console.error("Erreur lors de la vérification de session:", sessionError);
            toast({
              title: "Erreur de session",
              description: "Impossible de valider votre session. Veuillez réessayer.",
              variant: "destructive",
            });
            if (setIsLoading) {
              setIsLoading(false);
            }
          }
        }, 800);
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Gestion plus robuste des erreurs réseau
      if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('réseau')) {
        toast({
          title: "Problème de connexion réseau",
          description: "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.",
          variant: "destructive",
          action: (
            <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
              Réessayer
            </ToastAction>
          )
        });
      } else if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter. Veuillez réessayer.",
          variant: "destructive",
          action: (
            <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
              Réessayer
            </ToastAction>
          )
        });
      }
      
      if (setIsLoading) {
        setIsLoading(false);
      }
    }
  };

  return { handleSubmit };
};

export default useLoginSubmit;

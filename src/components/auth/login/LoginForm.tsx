
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";
import { ToastAction } from '@/components/ui/toast';
import { getNetworkStatus, attemptNetworkRecovery } from '@/utils/auth/networkUtils';

interface LoginFormProps {
  lastLoggedInEmail: string | null;
}

const LoginForm = ({ lastLoggedInEmail }: LoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Nettoyer les données d'authentification au chargement pour éviter les conflits
  useEffect(() => {
    clearStoredAuthData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
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
            password,
            options: {
              redirectTo: window.location.origin + '/dashboard'
            }
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
            setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
          placeholder="votre@email.com"
          required
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Mot de passe
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="pt-2">
        <Button 
          type="submit" 
          fullWidth 
          size="lg" 
          isLoading={isLoading} 
          className="group"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              Se connecter
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;

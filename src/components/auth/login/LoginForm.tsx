
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from "@/integrations/supabase/client";
import { ToastAction } from '@/components/ui/toast';

interface LoginFormProps {
  lastLoggedInEmail: string | null;
}

const LoginForm = ({ lastLoggedInEmail }: LoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loginAttempted = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performLogin = async (): Promise<boolean> => {
    try {
      // Force clear problematic stored sessions first
      localStorage.removeItem('supabase.auth.token');
      
      // Nettoyer tous les flags d'authentification
      const loginBlockingFlags = [
        'auth_checking',
        'auth_refreshing',
        'auth_redirecting',
        'auth_check_timestamp',
        'auth_refresh_timestamp',
        'auth_redirect_timestamp',
        'auth_signing_out',
        'sb-cfjibduhagxiwqkiyhqd-auth-token',
        'sb-cfjibduhagxiwqkiyhqd-auth-refresh'
      ];
      
      loginBlockingFlags.forEach(flag => {
        localStorage.removeItem(flag);
      });
      
      // Try using offline detection before making the request
      if (!navigator.onLine) {
        throw new Error("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
      }
      
      // Always manually sign in with the provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data && data.user) {
        // Save the email for future suggestions
        localStorage.setItem('last_logged_in_email', email);
        
        // Pre-fetch user data to avoid loading issues
        try {
          const { data: userData } = await supabase
            .from('user_balances')
            .select('subscription')
            .eq('id', data.user.id)
            .maybeSingle();
            
          if (userData) {
            localStorage.setItem('subscription', userData.subscription);
          }
        } catch (prefetchError) {
          console.warn("Prefetch warning (non-critical):", prefetchError);
        }
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Redirect with a short delay to ensure auth state is fully updated
        setTimeout(() => {
          loginAttempted.current = false;
          navigate('/dashboard', { replace: true });
        }, 1000);
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || loginAttempted.current) return;
    
    setIsLoading(true);
    loginAttempted.current = true;
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Définir les drapeaux de blocage au niveau de cette fonction
    const loginBlockingFlags = [
      'auth_checking',
      'auth_refreshing',
      'auth_redirecting',
      'auth_check_timestamp',
      'auth_refresh_timestamp',
      'auth_redirect_timestamp',
      'auth_signing_out',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'sb-cfjibduhagxiwqkiyhqd-auth-refresh'
    ];
    
    try {
      await performLogin();
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Améliorer la gestion des erreurs pour les problèmes de réseau et d'authentification
      if (error.message === "Failed to fetch" || 
          error.message?.includes("NetworkError") || 
          error.message?.includes("network") ||
          error.message?.includes("CORS") ||
          error.message?.includes("URL") ||
          !navigator.onLine) {
        
        // Préparation pour une nouvelle tentative silencieuse
        const retryDelay = 2000;
        console.log(`Tentative de reconnexion automatique dans ${retryDelay}ms...`);
        
        toast({
          title: "Problème de connexion",
          description: "La connexion au serveur a échoué. Une nouvelle tentative sera effectuée automatiquement.",
          duration: 6000,
          variant: "destructive"
        });
        
        // Tentative silencieuse après un délai
        retryTimeoutRef.current = setTimeout(async () => {
          if (navigator.onLine) {
            try {
              console.log("Tentative de reconnexion silencieuse...");
              // Une tentative avec options de domaine alternative
              try {
                // Nettoyage complet avant réessai
                loginBlockingFlags.forEach(flag => {
                  localStorage.removeItem(flag);
                });
              } catch (e) {
                console.warn("Erreur lors du nettoyage du stockage local:", e);
              }
              
              const success = await performLogin();
              if (!success) {
                setIsLoading(false);
                loginAttempted.current = false;
              }
            } catch (retryError) {
              console.error("La reconnexion a échoué:", retryError);
              setIsLoading(false);
              loginAttempted.current = false;
              
              toast({
                title: "Échec de la connexion",
                description: "Veuillez réessayer ultérieurement.",
                variant: "destructive",
                duration: 5000,
              });
            }
          } else {
            setIsLoading(false);
            loginAttempted.current = false;
            
            toast({
              title: "Toujours hors ligne",
              description: "Vérifiez votre connexion et réessayez.",
              variant: "destructive",
              duration: 5000,
              action: (
                <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
                  Réessayer
                </ToastAction>
              )
            });
          }
        }, retryDelay);
        
      } else if (error.message === "Invalid login credentials") {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        });
        setIsLoading(false);
        setTimeout(() => {
          loginAttempted.current = false;
        }, 1000);
      } else {
        toast({
          title: "Erreur de connexion",
          description: error.message || "Une erreur est survenue lors de la connexion",
          variant: "destructive",
        });
        setIsLoading(false);
        setTimeout(() => {
          loginAttempted.current = false;
        }, 1000);
      }
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
          disabled={isLoading || loginAttempted.current}
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

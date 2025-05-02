
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from "@/integrations/supabase/client";
import { ToastAction } from '@/components/ui/toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  const loginAttempted = useRef(false);
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Nettoyer les flags d'authentification potentiellement bloquants
  useEffect(() => {
    // Protection contre les blocages persistants
    const loginBlockingFlags = [
      'auth_checking',
      'auth_refreshing',
      'auth_redirecting',
      'auth_check_timestamp',
      'auth_refresh_timestamp',
      'auth_redirect_timestamp',
      'auth_signing_out'
    ];
    
    loginBlockingFlags.forEach(flag => {
      localStorage.removeItem(flag);
    });
    
    // Silencieusement nettoyer les jetons potentiellement invalides sans afficher d'alerte
    const authToken = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    if (authToken) {
      try {
        const tokenData = JSON.parse(authToken);
        const expiresAt = tokenData?.expires_at;
        
        if (expiresAt && Date.now() / 1000 >= expiresAt) {
          console.log("Detected expired token, cleaning up silently");
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        }
      } catch (e) {
        console.error("Error parsing auth token:", e);
      }
    }
  }, []);

  // Check existing session on mount but don't auto-redirect to dashboard
  const checkExistingSession = async () => {
    setIsCheckingSession(true);
    
    try {
      // Force clear problematic stored sessions
      localStorage.removeItem('supabase.auth.token');
      
      // We still check for a session, but we won't redirect automatically
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session check error:", error);
        setIsCheckingSession(false);
        return;
      }
      
      // Even if we have a valid session, we don't redirect automatically anymore
      // The user must explicitly log in with credentials
      setIsCheckingSession(false);
      
      // Get last email for suggestion only
      const savedEmail = localStorage.getItem('last_logged_in_email');
      if (savedEmail) {
        setLastLoggedInEmail(savedEmail);
        // We populate the email field but leave it editable
        setEmail(savedEmail);
      }
    } catch (err) {
      console.error("Session check failed:", err);
      setIsCheckingSession(false);
    }
  };
  
  useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      setIsCheckingSession(false);
    }, 3000); // Réduire le délai à 3 secondes max pour éviter un écran de chargement trop long
    
    checkExistingSession();
    
    return () => clearTimeout(sessionTimeout);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || loginAttempted.current) return;
    
    setIsLoading(true);
    loginAttempted.current = true;
    
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
        'auth_signing_out'
      ];
      
      loginBlockingFlags.forEach(flag => {
        localStorage.removeItem(flag);
      });
      
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
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Améliorer la gestion des erreurs pour les problèmes de réseau
      if (error.message === "Failed to fetch" || error.message?.includes("NetworkError") || error.message?.includes("network")) {
        toast({
          title: "Erreur de connexion réseau",
          description: "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.",
          variant: "destructive",
          duration: 8000,
          action: (
            <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
              Réessayer
            </ToastAction>
          )
        });
      } else if (error.message === "Invalid login credentials") {
        toast({
          title: "Identifiants incorrects",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: error.message || "Une erreur est survenue lors de la connexion",
          variant: "destructive",
        });
      }
      
      // Réinitialiser pour permettre de réessayer
      setTimeout(() => {
        loginAttempted.current = false;
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Si on vérifie encore la session, afficher un loader amélioré
  if (isCheckingSession) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f0f23]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center glass-panel p-8 rounded-xl shadow-lg">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg">Vérification de votre session...</p>
            <p className="mt-2 text-sm text-muted-foreground">Veuillez patienter un instant</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-28 pb-12">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Connectez-vous à votre compte</h1>
            <p className="text-muted-foreground mt-2">
              Accédez à votre tableau de bord Stream genius
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-xl">
            {lastLoggedInEmail && (
              <div className="mb-4 p-3 bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  Dernière connexion avec: <strong>{lastLoggedInEmail}</strong>
                </p>
                <p className="text-xs text-blue-300/80 mt-1">
                  Veuillez saisir vos identifiants pour vous connecter.
                </p>
              </div>
            )}
            
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
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas de compte ?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Inscrivez-vous
                </Link>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
              <ArrowLeft size={14} className="mr-1" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;

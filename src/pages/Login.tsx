
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  const [showResetAlert, setShowResetAlert] = useState(false);
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
    
    // Si un utilisateur arrive sur le login, c'est qu'il n'est probablement plus authentifié
    // Donc on peut vérifier et nettoyer les jetons potentiellement invalides
    const authToken = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    if (authToken) {
      try {
        // Analyser le jeton pour voir s'il est expiré
        const tokenData = JSON.parse(authToken);
        const expiresAt = tokenData?.expires_at;
        
        if (expiresAt && Date.now() / 1000 >= expiresAt) {
          console.log("Detected expired token, cleaning up");
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
          setShowResetAlert(true);
        }
      } catch (e) {
        console.error("Error parsing auth token:", e);
      }
    }
  }, []);

  // Check existing session on mount with timeout protection
  useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      setIsCheckingSession(false);
    }, 5000); // Ne jamais bloquer plus de 5 secondes
    
    const checkExistingSession = async () => {
      setIsCheckingSession(true);
      
      try {
        // Force clear problematic stored sessions
        localStorage.removeItem('supabase.auth.token');
        
        // Check for valid session
        const { data, error } = await supabase.auth.getSession();
        
        clearTimeout(sessionTimeout);
        
        if (error) {
          console.error("Session check error:", error);
          setIsCheckingSession(false);
          return;
        }
        
        // If we have a valid session, redirect to dashboard
        if (data.session) {
          // Vérifier que la session n'est pas expirée
          const expiresAt = data.session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          
          if (expiresAt && now >= expiresAt) {
            console.log("Session expired, staying on login");
            setIsCheckingSession(false);
            return;
          }
          
          console.log("Found existing session, redirecting to dashboard");
          navigate('/dashboard', { replace: true });
          return;
        }
        
        setIsCheckingSession(false);
      } catch (err) {
        console.error("Session check failed:", err);
        setIsCheckingSession(false);
      }
      
      // Get last email for suggestion
      const savedEmail = localStorage.getItem('last_logged_in_email');
      if (savedEmail) {
        setLastLoggedInEmail(savedEmail);
        setEmail(savedEmail);
      }
    };
    
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
      
      // Use signInWithPassword with explicit config
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
      toast({
        title: "Erreur de connexion",
        description: error.message === "Invalid login credentials" 
          ? "Email ou mot de passe incorrect" 
          : (error.message || "Une erreur est survenue lors de la connexion"),
        variant: "destructive",
      });
      
      // Réinitialiser pour permettre de réessayer
      setTimeout(() => {
        loginAttempted.current = false;
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour nettoyer complètement le localStorage avant de réessayer
  const handleClearAndRetry = () => {
    // Nettoyer tous les jetons et flags
    localStorage.clear();
    
    // Réinitialiser pour permettre de réessayer
    loginAttempted.current = false;
    setShowResetAlert(false);
    
    toast({
      title: "Cache nettoyé",
      description: "Vous pouvez maintenant vous reconnecter",
    });
    
    // Rafraîchir la page après un petit délai
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Si on vérifie encore la session, afficher un loader
  if (isCheckingSession) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Vérification de session...</p>
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
          
          {showResetAlert && (
            <Alert variant="warning" className="mb-6 bg-amber-900/20 border-amber-700/50 text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="flex flex-col gap-2">
                <p>Une session précédente a été détectée mais semble avoir expiré.</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-amber-800/50 hover:bg-amber-800/70 text-amber-100 mt-1"
                  onClick={handleClearAndRetry}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Nettoyer le cache et réessayer
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="glass-panel p-6 rounded-xl">
            {lastLoggedInEmail && (
              <div className="mb-4 p-3 bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  Dernière connexion avec: <strong>{lastLoggedInEmail}</strong>
                </p>
                <p className="text-xs text-blue-300/80 mt-1">
                  Vous pouvez vous connecter avec ce compte ou utiliser un autre compte.
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
              
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Mot de passe oublié?
                </Link>
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

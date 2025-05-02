
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from "@/integrations/supabase/client";
import { hasValidConnection } from '@/utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'dns_error' | 'offline'>('checking');
  const loginAttempted = useRef(false);
  const connectionCheckInterval = useRef<number | null>(null);
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Vérifier la connexion réseau et DNS
  useEffect(() => {
    const checkConnection = async () => {
      if (!navigator.onLine) {
        setConnectionStatus('offline');
        return;
      }
      
      try {
        const isValid = await hasValidConnection();
        setConnectionStatus(isValid ? 'ok' : 'dns_error');
      } catch (error) {
        console.error("Erreur lors de la vérification de connexion:", error);
        setConnectionStatus('dns_error');
      }
    };
    
    // Vérifier immédiatement
    checkConnection();
    
    // Vérifier périodiquement
    connectionCheckInterval.current = window.setInterval(checkConnection, 10000);
    
    // Écouter les changements d'état de connexion
    window.addEventListener('online', () => checkConnection());
    window.addEventListener('offline', () => setConnectionStatus('offline'));
    
    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
      window.removeEventListener('online', () => checkConnection());
      window.removeEventListener('offline', () => setConnectionStatus('offline'));
    };
  }, []);

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
  useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      setIsCheckingSession(false);
    }, 3000); // Réduire le délai à 3 secondes max pour éviter un écran de chargement trop long
    
    const checkExistingSession = async () => {
      setIsCheckingSession(true);
      
      try {
        // Force clear problematic stored sessions
        localStorage.removeItem('supabase.auth.token');
        
        // We still check for a session, but we won't redirect automatically
        const { data, error } = await supabase.auth.getSession();
        
        clearTimeout(sessionTimeout);
        
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
    
    checkExistingSession();
    
    return () => clearTimeout(sessionTimeout);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier l'état de la connexion avant de tenter la connexion
    if (connectionStatus === 'offline') {
      toast({
        title: "Erreur de connexion",
        description: "Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet.",
        variant: "destructive",
      });
      return;
    }
    
    if (connectionStatus === 'dns_error') {
      toast({
        title: "Problème de DNS détecté",
        description: "Essayez de vider votre cache DNS ou utilisez un autre réseau.",
        variant: "destructive",
      });
      // Continuer malgré l'erreur DNS, car la connexion pourrait quand même fonctionner
    }
    
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

  // Affichage d'un avertissement pour les problèmes de réseau
  const renderConnectionWarning = () => {
    if (connectionStatus === 'ok') return null;
    
    if (connectionStatus === 'offline') {
      return (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-900/50 rounded-lg">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm font-medium text-red-400">Vous êtes hors ligne</p>
          </div>
          <p className="text-xs text-red-300/80 mt-1">
            Vérifiez votre connexion internet et réessayez.
          </p>
        </div>
      );
    }
    
    if (connectionStatus === 'dns_error') {
      return (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-900/40 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-sm font-medium text-yellow-500">Problème de DNS détecté</p>
          </div>
          <p className="text-xs text-yellow-400/80 mt-1">
            Essayez de vider votre cache DNS ou utilisez un autre réseau.
          </p>
        </div>
      );
    }
    
    return null;
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
            {renderConnectionWarning()}
            
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
                  disabled={isLoading || loginAttempted.current || connectionStatus === 'offline'}
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

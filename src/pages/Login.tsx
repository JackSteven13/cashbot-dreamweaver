
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        
        // Vérifier et réparer l'authentification si nécessaire
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          toast({
            title: "Erreur",
            description: "Impossible de vérifier votre session.",
            variant: "destructive",
          });
          setIsCheckingSession(false);
          return;
        }
        
        if (session) {
          // Vérifier si le token est expiré ou près d'expirer
          const tokenExpiry = new Date(session.expires_at * 1000);
          const now = new Date();
          const timeToExpiry = tokenExpiry.getTime() - now.getTime();
          
          // Si le token expire dans moins de 5 minutes, le rafraîchir
          if (timeToExpiry < 300000) {
            console.log("Token expiring soon, refreshing session");
            try {
              const { data, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError || !data.session) {
                console.error("Session refresh failed:", refreshError);
                setIsCheckingSession(false);
                return;
              }
              
              console.log("Session refreshed successfully");
            } catch (refreshError) {
              console.error("Error refreshing session:", refreshError);
              setIsCheckingSession(false);
              return;
            }
          }
          
          console.log("User already logged in, redirecting to dashboard");
          navigate('/dashboard', { replace: true, state: { justLoggedIn: false } });
        } else {
          setIsCheckingSession(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Nettoyer les données de session précédentes
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Effectuer l'authentification avec les nouvelles informations
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data && data.user) {
        console.log("Login successful, user:", data.user.id);
        
        // Récupérer le profil utilisateur
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .maybeSingle();
        
        const displayName = profileData?.full_name || 
                           data.user.user_metadata?.full_name || 
                           email.split('@')[0];
        
        toast({
          title: `Bienvenue, ${displayName} !`,
          description: "Vous êtes maintenant connecté à votre compte CashBot.",
        });
        
        // Rediriger vers la page d'origine ou le tableau de bord avec l'état de connexion
        const from = location.state?.from?.pathname || '/dashboard';
        console.log("Redirecting to:", from);
        navigate(from, { state: { justLoggedIn: true }, replace: true });
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez vos identifiants et réessayez",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isCheckingSession) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Vérification de la session...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Connectez-vous</h1>
            <p className="text-muted-foreground mt-2">
              Accédez à votre compte CashBot
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                  placeholder="••••••••"
                  required
                />
                <div className="flex justify-end mt-1">
                  <Link to="/reset-password" className="text-xs text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>
              
              <div className="pt-2">
                <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="group">
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" /> 
                      Connexion...
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

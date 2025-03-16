
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { verifyAndRepairAuth, forceSignOut } from "@/utils/authUtils";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        
        // Nettoyer toute session résiduelle d'abord
        await forceSignOut();
        
        // Petit délai pour s'assurer que la déconnexion est traitée
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Maintenant vérifier s'il y a une session active
        const isValid = await verifyAndRepairAuth();
        
        if (!isMounted) return;
        
        if (isValid) {
          console.log("User already logged in, redirecting to dashboard");
          // Ajouter un délai court pour éviter les redirections trop rapides
          setTimeout(() => {
            if (isMounted) {
              navigate('/dashboard', { replace: true, state: { justLoggedIn: false } });
            }
          }, 500);
        } else {
          setIsCheckingSession(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // S'assurer qu'il n'y a pas de session résiduelle
      await forceSignOut();
      
      // Délai pour assurer que la session précédente est bien nettoyée
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Effectuer l'authentification avec les nouvelles informations
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data && data.user) {
        console.log("Login successful, user:", data.user.id);
        
        // Attendre que la session soit complètement établie
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Vérifier que la session est valide avant de rediriger
        const isSessionValid = await verifyAndRepairAuth();
        
        if (!isSessionValid) {
          throw new Error("Session could not be established");
        }
        
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
        
        // Utiliser un délai plus long pour éviter les problèmes de course
        setTimeout(() => {
          navigate(from, { state: { justLoggedIn: true }, replace: true });
        }, 800);
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez vos identifiants et réessayez",
        variant: "destructive",
      });
      
      // En cas d'erreur, essayer de nettoyer complètement la session
      try {
        await forceSignOut();
      } catch (cleanupError) {
        console.error("Error during cleanup after failed login:", cleanupError);
      }
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

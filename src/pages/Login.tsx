
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from "@/integrations/supabase/client";
import { verifyAuth } from '@/utils/auth/verificationUtils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const isAuthenticated = await verifyAuth();
        
        if (isAuthenticated) {
          console.log("User already authenticated, redirecting to dashboard");
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log("Attempting login with email:", email);
      
      // Utiliser la persistance par défaut (localStorage)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase login error:", error);
        throw error;
      }
      
      if (data && data.user) {
        console.log("Login successful, user:", data.user);
        
        // Attendre que l'authentification soit entièrement établie
        setTimeout(async () => {
          // Vérifier que la session est bien établie
          const isAuth = await verifyAuth();
          
          if (isAuth) {
            toast({
              title: "Connexion réussie",
              description: `Bienvenue ${data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'utilisateur'}!`,
            });
            
            // Simple redirect
            navigate('/dashboard', { replace: true });
          } else {
            console.error("Session not established after login");
            throw new Error("Session non établie après connexion");
          }
        }, 800);
      }
    } catch (error: any) {
      console.error("Login error details:", error);
      
      let errorMsg = "Une erreur est survenue lors de la connexion";
      
      if (error.message === "Invalid login credentials") {
        errorMsg = "Email ou mot de passe incorrect";
      } else if (error.message === "Email not confirmed") {
        errorMsg = "Email non confirmé. Veuillez vérifier votre boîte de réception pour confirmer votre adresse email.";
      } else if (error.message.includes("requested path is invalid")) {
        errorMsg = "Erreur de configuration - URL de redirection invalide. Contactez l'administrateur.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      toast({
        title: "Erreur de connexion",
        description: errorMsg,
        variant: "destructive",
      });
      
      setIsLoading(false);
    }
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
      
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Connectez-vous à votre compte</h1>
            <p className="text-muted-foreground mt-2">
              Accédez à votre tableau de bord CashBot
            </p>
          </div>
          
          <div className="glass-panel p-6 rounded-xl">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
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
                />
              </div>
              
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Mot de passe oublié?
                </Link>
              </div>
              
              <div className="pt-2">
                <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="group">
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

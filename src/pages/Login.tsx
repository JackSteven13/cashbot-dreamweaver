import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [lastLoggedInEmail, setLastLoggedInEmail] = useState<string | null>(null);
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Check existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      setIsCheckingSession(true);
      
      try {
        // Force clear problematic stored sessions
        localStorage.removeItem('supabase.auth.token');
        
        // Check for valid session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setIsCheckingSession(false);
          return;
        }
        
        // If we have a valid session, redirect to dashboard
        if (data.session) {
          console.log("Found existing session, redirecting to dashboard");
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
      
      // Get last email for suggestion
      const savedEmail = localStorage.getItem('last_logged_in_email');
      if (savedEmail) {
        setLastLoggedInEmail(savedEmail);
        setEmail(savedEmail);
      }
      
      setIsCheckingSession(false);
    };
    
    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Force clear problematic stored sessions first
      localStorage.removeItem('supabase.auth.token');
      
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
            .single();
            
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
          navigate('/dashboard', { replace: true });
        }, 800);
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
    } finally {
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

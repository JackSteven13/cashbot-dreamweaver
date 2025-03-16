
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { verifyAndRepairAuth, forceSignOut } from "@/utils/authUtils";
import { Input } from '@/components/ui/input';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const loginAttemptRef = useRef(0);
  const isSubmittingRef = useRef(false);
  
  // Improved session check on component mount
  useEffect(() => {
    let isMounted = true;
    let checkTimeout: NodeJS.Timeout;
    
    const checkSession = async () => {
      try {
        if (!isMounted) return;
        setIsCheckingSession(true);
        
        // Ensure we start with a clean session state
        await forceSignOut();
        
        // Short delay to ensure signout is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isMounted) return;
        
        setIsCheckingSession(false);
      } catch (error) {
        console.error("Session check error:", error);
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };
    
    checkTimeout = setTimeout(() => checkSession(), 500);
    
    return () => {
      isMounted = false;
      clearTimeout(checkTimeout);
    };
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return; // Prevent multiple submissions
    
    isSubmittingRef.current = true;
    setIsLoading(true);
    setLoginError(null);
    
    try {
      loginAttemptRef.current += 1;
      const attemptId = loginAttemptRef.current;
      console.log(`Starting login attempt #${attemptId}`);
      
      // Start fresh - ensure no lingering session
      await forceSignOut();
      
      // Wait for signout to complete
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Attempt login with provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data && data.user) {
        console.log(`Login attempt #${attemptId} successful, user:`, data.user.id);
        
        // Wait for session establishment - increased delay for stability
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Multiple verification attempts to ensure session is valid
        let isSessionValid = false;
        for (let i = 0; i < 5; i++) {
          isSessionValid = await verifyAndRepairAuth();
          if (isSessionValid) break;
          // Increasing wait times between attempts
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
        
        if (!isSessionValid) {
          throw new Error("Session could not be established after multiple attempts");
        }
        
        // Get user profile for display name
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
        
        // Redirect with longer delay to ensure session is fully established
        const from = location.state?.from?.pathname || '/dashboard';
        console.log(`Login attempt #${attemptId} redirecting to:`, from);
        
        // Clear any previous navigation attempt for this login
        setTimeout(() => {
          navigate(from, { 
            state: { 
              justLoggedIn: true,
              timestamp: new Date().getTime() // Add timestamp for uniqueness
            }, 
            replace: true 
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      setLoginError(error.message || "Vérifiez vos identifiants et réessayez");
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez vos identifiants et réessayez",
        variant: "destructive",
      });
      
      // Cleanup on error
      try {
        await forceSignOut();
      } catch (cleanupError) {
        console.error("Error during cleanup after failed login:", cleanupError);
      }
    } finally {
      setIsLoading(false);
      // Delay resetting the submitting flag to prevent rapid resubmission
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1000);
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
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3"
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
                  className="w-full p-3"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <div className="flex justify-end mt-1">
                  <Link to="/reset-password" className="text-xs text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>
              
              {loginError && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-100 p-2 rounded">
                  {loginError}
                </div>
              )}
              
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

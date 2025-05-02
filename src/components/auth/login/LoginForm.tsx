
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase, clearStoredAuthData } from "@/integrations/supabase/client";
import { ToastAction } from '@/components/ui/toast';

interface LoginFormProps {
  lastLoggedInEmail: string | null;
}

const LoginForm = ({ lastLoggedInEmail }: LoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Nettoyer complètement les données d'authentification stockées
    clearStoredAuthData();
    
    try {
      // Vérifier la connexion réseau
      if (!navigator.onLine) {
        throw new Error("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
      }
      
      // Tentative d'authentification avec Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data && data.user) {
        // Sauvegarder l'email pour les futures suggestions
        localStorage.setItem('last_logged_in_email', email);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'utilisateur'}!`,
        });
        
        // Redirection avec un délai pour s'assurer que l'état d'authentification est mis à jour
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        throw new Error("Échec de connexion: aucune donnée utilisateur retournée");
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Gestion des différents types d'erreurs
      if (!navigator.onLine) {
        toast({
          title: "Pas de connexion internet",
          description: "Vérifiez votre connexion réseau et réessayez.",
          variant: "destructive",
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
          description: "Impossible de se connecter. Veuillez réessayer.",
          variant: "destructive",
          action: (
            <ToastAction altText="Réessayer" onClick={() => window.location.reload()}>
              Réessayer
            </ToastAction>
          )
        });
      }
    } finally {
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

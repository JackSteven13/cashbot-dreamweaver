
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { toast } from '@/components/ui/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté à votre compte.",
      });
      navigate('/dashboard');
    }, 1500);
  };
  
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
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                  {!isLoading && <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />}
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

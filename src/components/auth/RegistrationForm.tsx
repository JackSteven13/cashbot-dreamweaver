
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/Button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { handleError, ErrorType } from '@/utils/errorHandling';

interface RegistrationFormProps {
  onSuccessfulRegistration: (name: string) => void;
}

const RegistrationForm = ({ onSuccessfulRegistration }: RegistrationFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) {
        if (error.message.includes('email') && error.message.includes('already')) {
          throw { message: "Cet email est déjà utilisé", code: "email_in_use" };
        }
        throw error;
      }
      
      if (data && data.user) {
        // Créer un profil pour l'utilisateur
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: name,
            email: email
          });
          
        // Initialiser les données utilisateur dans la base de données
        await supabase
          .from('user_balances')
          .upsert({
            id: data.user.id,
            balance: 0,
            daily_session_count: 0,
            subscription: 'freemium'
          });
        
        // Passer le nom à la fonction parent pour afficher un message de bienvenue
        onSuccessfulRegistration(name);
        
        // Sign in to ensure authenticated session
        await supabase.auth.signInWithPassword({
          email,
          password
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      // Utiliser la fonction handleError pour une gestion centralisée des erreurs
      handleError(error, "Inscription utilisateur", ErrorType.AUTHENTICATION, true);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nom complet
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
          placeholder="Votre nom"
          required
        />
      </div>
      
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
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full"
          placeholder="••••••••"
          required
        />
      </div>
      
      <div className="pt-2">
        <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="group">
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default RegistrationForm;

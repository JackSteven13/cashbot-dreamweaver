
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export const useRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSuccessfulRegistration = (name: string) => {
    // Afficher un message de bienvenue personnalisé
    toast({
      title: `Bienvenue, ${name} !`,
      description: "Votre compte a été créé avec succès. Vous êtes maintenant connecté à Stream Genius.",
    });
    
    // Attendre que la session soit établie avant de naviguer
    setIsLoading(true);
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1000);
  };
  
  return {
    handleSuccessfulRegistration
  };
};

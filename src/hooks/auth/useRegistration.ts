
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSuccessfulRegistration = (name: string) => {
    // Afficher un message de bienvenue personnalisé
    toast.success(`Bienvenue, ${name} !`, {
      description: "Votre compte a été créé avec succès. Vous êtes maintenant connecté à Stream Genius.",
      duration: 6000,
    });
    
    // Attendre que la session soit établie avant de naviguer
    setIsLoading(true);
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1000);
  };
  
  return {
    handleSuccessfulRegistration,
    isLoading
  };
};


import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import Button from '@/components/Button';

interface LoginButtonProps {
  isLoading: boolean;
  disabled?: boolean;
}

const LoginButton = ({ isLoading, disabled }: LoginButtonProps) => {
  return (
    <Button 
      type="submit" 
      fullWidth 
      size="lg" 
      isLoading={isLoading} 
      className="group"
      disabled={isLoading || disabled}
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
  );
};

export default LoginButton;

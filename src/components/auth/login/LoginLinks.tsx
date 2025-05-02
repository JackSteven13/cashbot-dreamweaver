
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LoginLinks = () => {
  return (
    <>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Vous n'avez pas de compte ?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Inscrivez-vous
          </Link>
        </p>
      </div>
      
      <div className="mt-8 text-center">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
          <ArrowLeft size={14} className="mr-1" />
          Retour à l'accueil
        </Link>
      </div>
    </>
  );
};

export default LoginLinks;

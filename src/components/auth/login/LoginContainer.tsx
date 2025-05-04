
import React from 'react';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginLinks from './LoginLinks';
import PreviousLoginInfo from './PreviousLoginInfo';
import AuthCleanup from './AuthCleanup';

interface LoginContainerProps {
  lastLoggedInEmail: string | null;
}

const LoginContainer = ({ lastLoggedInEmail }: LoginContainerProps) => {
  return (
    <div className="w-full max-w-md px-4">
      {/* Composant invisible qui nettoie les données d'authentification */}
      <AuthCleanup />
      
      <LoginHeader />
      
      <div className="glass-panel p-6 rounded-xl">
        <PreviousLoginInfo lastLoggedInEmail={lastLoggedInEmail} />
        <LoginForm lastLoggedInEmail={lastLoggedInEmail} />
        <LoginLinks />
      </div>
    </div>
  );
};

export default LoginContainer;

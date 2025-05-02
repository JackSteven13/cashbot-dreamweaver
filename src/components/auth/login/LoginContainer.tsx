
import React from 'react';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginLinks from './LoginLinks';
import PreviousLoginInfo from './PreviousLoginInfo';

interface LoginContainerProps {
  lastLoggedInEmail: string | null;
}

const LoginContainer = ({ lastLoggedInEmail }: LoginContainerProps) => {
  return (
    <div className="w-full max-w-md px-4">
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

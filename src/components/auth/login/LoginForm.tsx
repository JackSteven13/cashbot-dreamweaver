
import React from 'react';
import { LoginButton, LoginFields, useLoginFormState, useLoginSubmit } from './form';

interface LoginFormProps {
  lastLoggedInEmail: string | null;
}

const LoginForm = ({ lastLoggedInEmail }: LoginFormProps) => {
  const { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    isLoading, 
    setIsLoading 
  } = useLoginFormState(lastLoggedInEmail);
  
  const { handleSubmit } = useLoginSubmit();

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, email, password, setIsLoading);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <LoginFields
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
      />
      
      <div className="pt-2">
        <LoginButton isLoading={isLoading} />
      </div>
    </form>
  );
};

export default LoginForm;

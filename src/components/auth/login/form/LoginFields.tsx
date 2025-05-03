
import React from 'react';
import { Input } from '@/components/ui/input';

interface LoginFieldsProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
}

const LoginFields = ({ 
  email, 
  setEmail, 
  password, 
  setPassword,
  isLoading 
}: LoginFieldsProps) => {
  return (
    <>
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
    </>
  );
};

export default LoginFields;


import { useState } from 'react';

export const useLoginFormState = (lastLoggedInEmail: string | null) => {
  const [email, setEmail] = useState(lastLoggedInEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    setIsLoading
  };
};

export default useLoginFormState;

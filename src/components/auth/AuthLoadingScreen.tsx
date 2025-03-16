
import { FC } from 'react';
import { Loader2 } from 'lucide-react';

const AuthLoadingScreen: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <span className="ml-2 text-blue-300 mt-4">Vérification de l'authentification...</span>
    </div>
  );
};

export default AuthLoadingScreen;

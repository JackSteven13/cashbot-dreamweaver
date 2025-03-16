
import { FC } from 'react';
import { Loader2 } from 'lucide-react';

const AuthLoadingScreen: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
      <div className="text-center">
        <span className="text-blue-300 mb-2 block">Vérification de l'authentification...</span>
        <span className="text-xs text-blue-200">Cela peut prendre quelques secondes</span>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;


import { FC } from 'react';
import { Loader2, RefreshCcw, LogOut } from 'lucide-react';

interface AuthRecoveryScreenProps {
  isRetrying: boolean;
  onRetry: () => void;
  onCleanLogin: () => void;
}

const AuthRecoveryScreen: FC<AuthRecoveryScreenProps> = ({ 
  isRetrying, 
  onRetry, 
  onCleanLogin 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white p-4">
      <div className="glass-panel p-6 rounded-xl max-w-md w-full text-center">
        <h2 className="text-xl font-bold mb-4">Problème de connexion</h2>
        <p className="mb-6">Nous n'arrivons pas à vérifier votre session. Cela peut être dû à:</p>
        
        <ul className="text-left mb-6 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Une connexion internet instable</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Une session expirée ou corrompue</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Un problème temporaire avec le service</span>
          </li>
        </ul>
        
        <div className="space-y-3">
          <button 
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
          >
            {isRetrying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Tentative en cours...
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Réessayer
              </>
            )}
          </button>
          
          <button 
            onClick={onCleanLogin}
            className="w-full flex items-center justify-center px-4 py-2 bg-transparent border border-white/30 hover:bg-white/10 rounded transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se connecter à nouveau
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRecoveryScreen;

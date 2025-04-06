
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LogOut, AlertTriangle } from 'lucide-react';

interface ProtectedRouteRecoveryProps {
  isRetrying: boolean;
  autoRetryCount: React.MutableRefObject<number> | number;
  maxAutoRetries: number;
  onRetry: () => void;
  onCleanLogin: () => void;
}

const ProtectedRouteRecovery: React.FC<ProtectedRouteRecoveryProps> = ({
  isRetrying,
  autoRetryCount,
  maxAutoRetries,
  onRetry,
  onCleanLogin
}) => {
  // Gérer le cas où autoRetryCount peut être un nombre ou une ref
  const retryCount = typeof autoRetryCount === 'number' 
    ? autoRetryCount 
    : autoRetryCount.current;

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f23] text-white items-center justify-center px-4">
      <div className="max-w-md w-full p-6 rounded-xl bg-slate-800/80 backdrop-blur border border-slate-700/50 shadow-xl">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Problème de connexion</h2>
          <p className="text-slate-300">
            Nous avons rencontré un problème lors de la vérification de votre session.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {retryCount}/{maxAutoRetries} tentatives automatiques effectuées
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-medium mb-1 text-yellow-400">Solutions possibles:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Vérifiez votre connexion internet</li>
              <li>Essayez de vous reconnecter</li>
              <li>Videz le cache de votre navigateur</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {isRetrying ? 'Tentative en cours...' : 'Réessayer'}
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={onCleanLogin}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se reconnecter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRouteRecovery;

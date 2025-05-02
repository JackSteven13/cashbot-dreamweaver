
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LogOut, WifiOff, AlertTriangle, Globe } from 'lucide-react';

interface ConnectionErrorScreenProps {
  errorType: string;
  onRetry: () => void;
  onCleanLogin: () => void;
}

const ConnectionErrorScreen: React.FC<ConnectionErrorScreenProps> = ({
  errorType,
  onRetry,
  onCleanLogin
}) => {
  const renderErrorIcon = () => {
    switch (errorType) {
      case 'offline':
        return <WifiOff className="h-12 w-12 text-red-500" />;
      case 'dns':
        return <Globe className="h-12 w-12 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-orange-500" />;
    }
  };
  
  const getErrorTitle = () => {
    switch (errorType) {
      case 'offline':
        return "Vous êtes hors ligne";
      case 'dns':
        return "Problème de DNS détecté";
      default:
        return "Problème de connexion";
    }
  };
  
  const getErrorDescription = () => {
    switch (errorType) {
      case 'offline':
        return "Vérifiez votre connexion internet et réessayez.";
      case 'dns':
        return "Votre appareil rencontre des difficultés à résoudre les noms de domaine. Essayez de vider votre cache DNS ou utilisez un autre réseau.";
      default:
        return "Un problème de connexion a été détecté. Veuillez vérifier votre connexion internet.";
    }
  };
  
  const getTips = () => {
    switch (errorType) {
      case 'offline':
        return [
          "Vérifiez votre connexion WiFi ou données mobiles",
          "Désactivez le mode avion si activé",
          "Redémarrez votre routeur"
        ];
      case 'dns':
        return [
          "Essayez d'utiliser un autre réseau (données mobiles)",
          "Videz le cache DNS de votre navigateur",
          "Utilisez un autre serveur DNS (1.1.1.1 ou 8.8.8.8)"
        ];
      default:
        return [
          "Vérifiez votre connexion internet",
          "Essayez d'utiliser un autre navigateur",
          "Désactivez les extensions qui pourraient bloquer les connexions"
        ];
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f23] text-white items-center justify-center px-4">
      <div className="max-w-md w-full p-6 rounded-xl bg-slate-800/80 backdrop-blur border border-slate-700/50 shadow-xl">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {renderErrorIcon()}
          </div>
          <h2 className="text-xl font-semibold mb-2">{getErrorTitle()}</h2>
          <p className="text-slate-300">
            {getErrorDescription()}
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-medium mb-1 text-yellow-400">Solutions possibles:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {getTips().map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              onClick={onRetry}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Réessayer
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

export default ConnectionErrorScreen;

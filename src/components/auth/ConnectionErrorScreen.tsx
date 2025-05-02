
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LogOut, WifiOff, AlertTriangle, Globe, Router } from 'lucide-react';

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
      case 'network':
        return <Router className="h-12 w-12 text-orange-500" />;
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
      case 'network':
        return "Problème de connectivité réseau";
      default:
        return "Problème de connexion";
    }
  };
  
  const getErrorDescription = () => {
    switch (errorType) {
      case 'offline':
        return "Votre appareil n'est pas connecté à internet. Veuillez activer votre connexion WiFi ou données mobiles et réessayer.";
      case 'dns':
        return "Votre appareil rencontre des difficultés à résoudre les adresses internet. Essayez d'utiliser un autre réseau ou les données mobiles.";
      case 'network':
        return "Impossible d'établir une connexion avec nos serveurs. Vérifiez que votre réseau n'est pas trop restreint ou filtré.";
      default:
        return "Un problème de connexion a été détecté. Veuillez vérifier votre connexion internet et réessayer.";
    }
  };
  
  const getTips = () => {
    switch (errorType) {
      case 'offline':
        return [
          "Vérifiez que le mode avion est désactivé",
          "Activez votre WiFi ou données mobiles",
          "Redémarrez votre appareil si le problème persiste",
          "Vérifiez la couverture réseau dans votre zone"
        ];
      case 'dns':
        return [
          "Basculez sur les données mobiles plutôt que le WiFi",
          "Utilisez un VPN ou changez de DNS (1.1.1.1, 8.8.8.8)",
          "Videz le cache de votre navigateur",
          "Essayez un autre navigateur (Chrome, Safari, Firefox)"
        ];
      case 'network':
        return [
          "Vérifiez si votre réseau bloque certaines connexions",
          "Désactivez les extensions de navigateur qui filtrent le trafic",
          "Essayez depuis un autre réseau",
          "Vérifiez que votre pare-feu n'est pas trop restrictif"
        ];
      default:
        return [
          "Vérifiez votre connexion internet",
          "Essayez de vous connecter depuis un autre appareil",
          "Utilisez un autre réseau (domicile, travail, données mobiles)",
          "Videz le cache de votre navigateur"
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
            <p className="font-medium mb-1 text-yellow-400">Solutions recommandées:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {getTips().map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600 flex items-center justify-center"
              onClick={onRetry}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tester la connexion
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full flex items-center justify-center"
              onClick={onCleanLogin}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se reconnecter
            </Button>
          </div>

          <p className="text-xs text-center text-slate-400 mt-4">
            Si le problème persiste, essayez de vous connecter depuis un autre appareil ou réseau.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionErrorScreen;

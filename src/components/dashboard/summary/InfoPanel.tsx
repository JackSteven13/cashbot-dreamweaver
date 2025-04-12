
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InfoPanelProps {
  isNewUser?: boolean;
  subscription?: string;
  dailySessionCount?: number;
  lastSessionTimestamp?: string;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  isNewUser = false,
  subscription = 'freemium',
  dailySessionCount = 0,
  lastSessionTimestamp
}) => {
  // Déterminer le contenu à afficher en fonction du statut de l'utilisateur
  const getContent = () => {
    if (isNewUser) {
      return {
        icon: <Info className="h-5 w-5 text-blue-500" />,
        title: "Bienvenue sur la plateforme!",
        description: "Commencez par lancer votre première analyse pour générer des revenus. Consultez notre guide de démarrage pour maximiser vos gains."
      };
    }
    
    if (subscription === 'freemium' && dailySessionCount >= 1) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        title: "Limite de sessions quotidienne atteinte",
        description: "Vous avez atteint votre limite de sessions pour aujourd'hui. Revenez demain ou passez à un forfait supérieur pour continuer."
      };
    }
    
    // Afficher quand la dernière session a été effectuée
    if (lastSessionTimestamp) {
      const lastSessionTime = new Date(lastSessionTimestamp);
      const timeAgo = formatDistanceToNow(lastSessionTime, { addSuffix: true, locale: fr });
      
      return {
        icon: <Info className="h-5 w-5 text-blue-500" />,
        title: "Dernière analyse",
        description: `Votre dernière analyse a été effectuée ${timeAgo}. Vous pouvez en démarrer une nouvelle maintenant.`
      };
    }
    
    // Message par défaut
    return {
      icon: <Info className="h-5 w-5 text-blue-500" />,
      title: "Prêt pour une analyse",
      description: "Démarrez une nouvelle analyse pour générer des revenus. Les résultats seront automatiquement ajoutés à votre solde."
    };
  };
  
  const content = getContent();
  
  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm border-t-4 border-t-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            {content.icon}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {content.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {content.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InfoPanel;

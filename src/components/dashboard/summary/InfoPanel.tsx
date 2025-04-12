
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Calendar, Clock } from 'lucide-react';
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
  // Get time since last session
  const getLastSessionTime = () => {
    if (!lastSessionTimestamp) return "Aucune session";
    
    try {
      const lastSessionDate = new Date(lastSessionTimestamp);
      return formatDistanceToNow(lastSessionDate, { addSuffix: true, locale: fr });
    } catch (error) {
      return "Date inconnue";
    }
  };

  return (
    <Card className="border border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-medium text-blue-800 dark:text-blue-300">
              {isNewUser ? "Bienvenue dans votre tableau de bord !" : "Information"}
            </h3>
            
            <div className="text-sm text-blue-700 dark:text-blue-200">
              {isNewUser ? (
                <p>
                  Commencez par lancer votre première session d'analyse pour générer des revenus. 
                  Votre forfait actuel <span className="font-semibold capitalize">{subscription}</span> vous 
                  permet d'effectuer plusieurs analyses par jour.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    <span>Sessions aujourd'hui: <span className="font-semibold">{dailySessionCount}</span></span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    <span>Dernière session: <span className="font-semibold">{getLastSessionTime()}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InfoPanel;

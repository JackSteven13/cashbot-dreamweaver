
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Bot, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SessionInfoProps {
  dailySessionCount?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  dailySessionCount = 0,
  lastSessionTimestamp,
  isBotActive = false
}) => {
  const formatLastSessionTime = (): string => {
    if (!lastSessionTimestamp) {
      return "Aucune session récente";
    }
    
    try {
      const lastSessionDate = new Date(lastSessionTimestamp);
      return `Il y a ${formatDistanceToNow(lastSessionDate, { locale: fr })}`;
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return "Aucune session récente";
    }
  };
  
  return (
    <Card className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <CardContent className="p-4">
        <h3 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
          <Activity className="inline mr-2 text-blue-500" size={18} />
          Informations sur les sessions
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-slate-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Dernière session</span>
            <span className="ml-auto text-slate-600 dark:text-slate-400">
              {formatLastSessionTime()}
            </span>
          </div>
          
          <div className="flex items-center">
            <Bot className={`h-4 w-4 mr-2 ${isBotActive ? 'text-green-500' : 'text-amber-500'}`} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Robot d'analyse</span>
            <span className={`ml-auto ${isBotActive ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} font-medium`}>
              {isBotActive ? 'Actif' : 'En pause'}
            </span>
          </div>
          
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2 text-slate-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Sessions aujourd'hui:</span>
            <span className="ml-auto text-slate-600 dark:text-slate-400">
              {dailySessionCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionInfo;

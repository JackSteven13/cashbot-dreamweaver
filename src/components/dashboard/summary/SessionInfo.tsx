
import React from 'react';
import { ClockIcon, ActivityIcon, BotIcon } from 'lucide-react';
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
  isBotActive = true
}) => {
  // Formater la date de dernière session
  const formattedLastSession = lastSessionTimestamp 
    ? formatDistanceToNow(new Date(lastSessionTimestamp), { addSuffix: true, locale: fr })
    : 'Aucune session récente';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm mb-3">
      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
        <ActivityIcon size={16} className="inline mr-1.5 text-blue-500" />
        Informations sur les sessions
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center text-sm">
          <div className="bg-blue-50 p-1.5 rounded-full mr-2">
            <ClockIcon size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500">Dernière session</p>
            <p className="font-medium text-gray-800">{formattedLastSession}</p>
          </div>
        </div>
        
        <div className="flex items-center text-sm">
          <div className={`${isBotActive ? 'bg-green-50' : 'bg-amber-50'} p-1.5 rounded-full mr-2`}>
            <BotIcon size={14} className={isBotActive ? 'text-green-600' : 'text-amber-600'} />
          </div>
          <div>
            <p className="text-gray-500">Robot d'analyse</p>
            <p className={`font-medium ${isBotActive ? 'text-green-700' : 'text-amber-700'}`}>
              {isBotActive ? 'Actif' : 'En pause'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center">
        <ActivityIcon size={12} className="inline mr-1 text-blue-400" />
        <span>Sessions aujourd'hui: <span className="font-semibold">{dailySessionCount}</span></span>
      </div>
    </div>
  );
};

export default SessionInfo;

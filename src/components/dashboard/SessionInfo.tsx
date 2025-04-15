
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Bot, Activity, Zap } from 'lucide-react';
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
  const [animateCount, setAnimateCount] = useState(false);
  
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
  
  // Animation effect when session count changes
  useEffect(() => {
    if (dailySessionCount > 0) {
      setAnimateCount(true);
      const timer = setTimeout(() => setAnimateCount(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [dailySessionCount]);
  
  // Current bot status
  const [botStatus, setBotStatus] = useState<string>('idle');
  
  // Simulate bot activity
  useEffect(() => {
    if (!isBotActive) return;
    
    const statuses = ['scanning', 'analyzing', 'processing', 'idle'];
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * statuses.length);
      setBotStatus(statuses[randomIndex]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isBotActive]);
  
  // Bot status text
  const getBotStatusText = () => {
    if (!isBotActive) return 'En pause';
    
    switch (botStatus) {
      case 'scanning': return 'Scan en cours';
      case 'analyzing': return 'Analyse en cours';
      case 'processing': return 'Traitement des données';
      case 'idle': 
      default: return 'Actif';
    }
  };
  
  // Calculate uptime
  const [uptime, setUptime] = useState('00:00:00');
  
  useEffect(() => {
    if (!isBotActive) return;
    
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      setUptime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isBotActive]);
  
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
            <Bot className={`h-4 w-4 mr-2 ${isBotActive ? 'text-green-500' : 'text-amber-500'} ${botStatus !== 'idle' && isBotActive ? 'animate-pulse' : ''}`} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Robot d'analyse</span>
            <span className={`ml-auto ${isBotActive ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} font-medium flex items-center`}>
              {getBotStatusText()}
              {isBotActive && botStatus !== 'idle' && (
                <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse"/>
              )}
            </span>
          </div>
          
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2 text-slate-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Sessions aujourd'hui:</span>
            <span className={`ml-auto text-slate-600 dark:text-slate-400 ${animateCount ? 'text-green-500 dark:text-green-400 font-bold transition-colors' : ''}`}>
              {dailySessionCount}
            </span>
          </div>
          
          {isBotActive && (
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2 text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Temps d'exécution:</span>
              <span className="ml-auto text-slate-600 dark:text-slate-400 font-mono">
                {uptime}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionInfo;

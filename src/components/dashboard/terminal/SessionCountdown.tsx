
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SessionCountdownProps {
  timeRemaining: string;
}

export const SessionCountdown: React.FC<SessionCountdownProps> = ({ timeRemaining }) => {
  return (
    <div className="mb-5 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-sm font-medium text-gray-200">Prochaine session disponible dans :</span>
        </div>
        <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-800 px-3 py-1 text-md">
          {timeRemaining}
        </Badge>
      </div>
    </div>
  );
};

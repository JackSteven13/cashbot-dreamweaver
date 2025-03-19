
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SessionCountdownProps {
  timeRemaining: string;
}

export const SessionCountdown: React.FC<SessionCountdownProps> = ({ timeRemaining }) => {
  return (
    <div className="mb-5 glass-effect p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-blue-300 mr-2" />
          <span className="text-sm font-medium text-blue-100">Prochaine session disponible dans :</span>
        </div>
        <Badge variant="outline" className="bg-indigo-600/30 text-indigo-200 border-indigo-500/50 font-mono">
          {timeRemaining}
        </Badge>
      </div>
    </div>
  );
};

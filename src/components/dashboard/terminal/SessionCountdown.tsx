
import React from 'react';
import { Clock } from 'lucide-react';

interface SessionCountdownProps {
  timeRemaining: string;
}

export const SessionCountdown: React.FC<SessionCountdownProps> = ({ timeRemaining }) => {
  return (
    <div className="mb-5 bg-slate-800/80 p-4 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="h-7 w-7 text-blue-400" />
          <span className="text-lg font-medium text-white">Prochaine session disponible dans :</span>
        </div>
        <div className="bg-blue-900/50 text-blue-300 text-xl font-bold py-2 px-5 rounded-full border border-blue-800">
          {timeRemaining}
        </div>
      </div>
    </div>
  );
};

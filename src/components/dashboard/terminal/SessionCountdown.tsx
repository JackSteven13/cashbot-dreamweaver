
import React from 'react';

export interface SessionCountdownProps {
  timeRemaining: string;
}

export const SessionCountdown: React.FC<SessionCountdownProps> = ({ timeRemaining }) => {
  return (
    <div className="text-gray-400">
      {'>'} Prochaine session disponible dans: <span className="text-red-400 font-mono">{timeRemaining}</span>
      <div className="mt-2 text-gray-500 text-xs">Le système se réinitialisera automatiquement à minuit (heure de Paris).</div>
    </div>
  );
};


import React from 'react';

export interface SystemInfoProps {
  isNewUser?: boolean;
  subscription?: string;
  onFeedbackClick?: () => void;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({ 
  isNewUser = false,
  subscription = 'freemium',
  onFeedbackClick
}) => {
  return (
    <div className="mb-4">
      <div className="text-green-400 mb-1.5">$ system.bootSequence()</div>
      
      <div className="pl-4 text-gray-400">
        <div className="mb-1">{'>'} Initialisation... <span className="text-green-400">OK</span></div>
        <div className="mb-1">{'>'} Vérification système... <span className="text-green-400">OK</span></div>
        <div className="mb-1">{'>'} Chargement algorithmes... <span className="text-green-400">OK</span></div>
        <div className="mb-1">
          {'>'} Compte: <span className={isNewUser ? "text-yellow-400" : "text-green-400"}>
            {isNewUser ? 'Nouveau' : 'Vérifié'}
          </span>
        </div>
        <div className="mb-1">
          {'>'} Plan: <span className="text-blue-400">{subscription}</span>
        </div>
        <div>{'>'} Système prêt</div>
        
        {onFeedbackClick && (
          <button 
            onClick={onFeedbackClick}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            [Envoyer feedback]
          </button>
        )}
      </div>
    </div>
  );
};

export const SystemInfoGrid: React.FC<SystemInfoProps> = ({ 
  isNewUser = false,
  subscription = 'freemium'
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
      <div className="bg-slate-800 p-2 rounded">
        <span className="text-gray-400">STATUS:</span> <span className="text-green-400">ACTIVE</span>
      </div>
      <div className="bg-slate-800 p-2 rounded">
        <span className="text-gray-400">USER:</span> <span className={isNewUser ? "text-yellow-400" : "text-green-400"}>
          {isNewUser ? 'NEW' : 'VERIFIED'}
        </span>
      </div>
      <div className="bg-slate-800 p-2 rounded">
        <span className="text-gray-400">PLAN:</span> <span className="text-blue-400">{subscription.toUpperCase()}</span>
      </div>
      <div className="bg-slate-800 p-2 rounded">
        <span className="text-gray-400">VERSION:</span> <span className="text-purple-400">2.3.1</span>
      </div>
    </div>
  );
};

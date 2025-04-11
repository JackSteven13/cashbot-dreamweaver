
import React from 'react';
import { X } from 'lucide-react';

interface TerminalOverlayProps {
  lines: string[];
  complete?: boolean;
  limitReached?: boolean;
  countdownTime?: string;
  isBackground?: boolean;
}

const TerminalOverlay: React.FC<TerminalOverlayProps> = ({ 
  lines, 
  complete = false,
  limitReached = false,
  countdownTime = "00:00:00",
  isBackground = false
}) => {
  if (lines.length === 0) return null;
  
  // Pour les terminaux en arrière-plan, utiliser une notification toast-like plutôt qu'un overlay complet
  if (isBackground) {
    return (
      <div className="fixed top-16 right-4 z-50 max-w-sm bg-slate-800 border border-slate-700 rounded-lg shadow-lg animate-fade-in">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className={`text-base font-medium ${complete ? 'text-green-400' : 'text-blue-400'}`}>
              {complete ? 'Analyse terminée' : 'Analyse en cours'}
            </h3>
            <button className="text-gray-400 hover:text-gray-200">
              <X size={16} />
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-200 max-h-32 overflow-y-auto">
            {lines.map((line, index) => (
              <div key={index} className={index === lines.length - 1 ? 'text-green-300' : 'text-gray-300'}>
                {line}
              </div>
            ))}
          </div>
          {limitReached && (
            <div className="mt-2 text-xs text-amber-400">
              Retour dans {countdownTime}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Pour les terminaux en premier plan, afficher un overlay complet
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg w-11/12 max-w-lg p-6 border border-slate-800 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${complete ? 'text-green-400' : 'text-blue-400'}`}>
            {complete ? 'Analyse terminée' : 'Analyse en cours...'}
          </h3>
          <button className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="terminal-output space-y-2 mb-4">
          {lines.map((line, index) => (
            <div key={index} className={`font-mono text-sm ${index === lines.length - 1 && complete ? 'text-green-300 font-bold' : 'text-gray-300'}`}>
              {line}
            </div>
          ))}
        </div>
        
        {!complete && !limitReached && (
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-1/3"></div>
          </div>
        )}
        
        {limitReached && (
          <div className="mt-4 text-center">
            <p className="text-amber-400 text-sm mb-1">Limite journalière atteinte</p>
            <p className="text-amber-500 text-xl font-bold">{countdownTime}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalOverlay;

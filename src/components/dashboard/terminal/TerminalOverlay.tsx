
import React, { useState, useEffect } from 'react';
import TerminalOutput from './TerminalOutput';
import { X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TerminalOverlayProps {
  lines: Array<{text: string, type: string}>;
  isComplete?: boolean;
  isLimitReached?: boolean;
  isDismissable?: boolean;
  countdownTime?: string;
  isBackgroundMode?: boolean;
}

const TerminalOverlay: React.FC<TerminalOverlayProps> = ({ 
  lines,
  isComplete = false,
  isLimitReached = false,
  isDismissable = false,
  countdownTime = "",
  isBackgroundMode = false
}) => {
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  
  // Si en mode arrière-plan, ne pas afficher l'overlay
  if (isBackgroundMode) return null;
  
  // Si fermé, ne rien afficher
  if (!visible) return null;
  
  return (
    <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center transition-opacity ${minimized ? 'bg-transparent' : ''}`}>
      <div 
        className={`
          bg-gray-900 border border-gray-700 rounded-lg shadow-2xl
          transition-all duration-300 ease-in-out
          ${minimized 
            ? 'w-64 h-12 fixed bottom-4 right-4 overflow-hidden flex items-center' 
            : 'w-11/12 max-w-3xl h-3/4 overflow-hidden flex flex-col'}
        `}
      >
        {/* Terminal header */}
        <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <div className="flex space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-300 text-sm font-mono">
              {isLimitReached 
                ? "Limite d'analyse atteinte" 
                : isComplete 
                  ? "Analyse terminée"
                  : "Analyse en cours..."}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => setMinimized(!minimized)}
            >
              <Minimize2 size={16} />
            </Button>
            
            {isDismissable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={() => setVisible(false)}
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
        
        {/* Terminal content */}
        <div className={`flex-1 overflow-hidden p-4 ${minimized ? 'hidden' : ''}`}>
          <TerminalOutput outputs={lines} scrollToBottom={true} />
          
          {countdownTime && (
            <div className="mt-4 p-2 bg-gray-800 rounded border border-gray-700 text-center">
              <span className="text-gray-300 text-sm">
                Prochaine analyse disponible dans: <span className="text-blue-400 font-mono">{countdownTime}</span>
              </span>
            </div>
          )}
        </div>
        
        {minimized && (
          <div className="flex-1 flex items-center px-3">
            <span className="text-gray-300 text-xs truncate">
              {isComplete ? "Analyse terminée" : "Analyse en cours..."}
            </span>
            <div className="ml-2 activity-indicator active"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalOverlay;

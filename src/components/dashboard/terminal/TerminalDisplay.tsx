
import React from 'react';

interface TerminalDisplayProps {
  showAnalysis?: boolean;
  terminalLines?: string[];
  analysisComplete?: boolean;
  limitReached?: boolean;
  countdownTime?: number;
}

export const TerminalDisplay: React.FC<TerminalDisplayProps> = ({
  showAnalysis = false,
  terminalLines = [],
  analysisComplete = false,
  limitReached = false,
  countdownTime = 0
}) => {
  if (!showAnalysis) {
    return null;
  }
  
  return (
    <div className="bg-black rounded-lg p-3 mb-4 font-mono text-xs text-green-500 h-48 overflow-y-auto">
      <div className="terminal-header text-white mb-2 border-b border-gray-700 pb-1 flex justify-between">
        <span>Traitement d'analyse algorithmique</span>
        <span className="text-xs text-gray-400">{new Date().toISOString()}</span>
      </div>
      
      {terminalLines.map((line, index) => (
        <div key={index} className="terminal-line py-1">
          <span className="text-gray-400 mr-2">$</span>
          <span className="text-green-400">{line}</span>
        </div>
      ))}
      
      {analysisComplete && (
        <div className="text-blue-300 mt-2 border-t border-gray-700 pt-1">
          {limitReached ? (
            <div className="text-yellow-300">
              ** Limite journalière atteinte. Veuillez attendre le prochain cycle ou mettre à niveau votre abonnement. **
            </div>
          ) : (
            <div>
              ** Analyse complétée avec succès. Algorithme optimisé pour votre abonnement. **
            </div>
          )}
        </div>
      )}
      
      {!analysisComplete && countdownTime > 0 && (
        <div className="text-yellow-300 mt-2 border-t border-gray-700 pt-1">
          Prochaine analyse automatique disponible dans: {Math.floor(countdownTime / 60)}:{(countdownTime % 60).toString().padStart(2, "0")}
        </div>
      )}
    </div>
  );
};

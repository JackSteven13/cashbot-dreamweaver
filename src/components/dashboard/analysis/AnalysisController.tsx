
import React, { useEffect, useState } from 'react';
import { useTerminalAnalysis } from '@/hooks/useTerminalAnalysis';

interface AnalysisControllerProps {
  children: React.ReactNode;
}

/**
 * Controller component to handle in-dashboard analysis without redirecting
 * or showing full-page loading screens
 */
const AnalysisController: React.FC<AnalysisControllerProps> = ({ children }) => {
  const { 
    showAnalysis,
    terminalLines,
    analysisComplete,
    limitReached,
    countdownTime,
    isBackgroundMode
  } = useTerminalAnalysis();
  
  // Only show in-dashboard terminal UI for analysis, no more full page loading
  if (showAnalysis && !isBackgroundMode) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-black border border-slate-700 rounded-md p-6 w-full max-w-xl shadow-xl">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-green-400 font-mono">Système d'analyse</h3>
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>
          
          <div className="font-mono text-sm h-64 overflow-y-auto bg-black border border-slate-800 p-4 rounded">
            {terminalLines.map((line, index) => (
              <div key={index} className="mb-2">
                <span className="text-green-400">{'> '}</span>
                <span className="text-slate-300">{line}</span>
              </div>
            ))}
            
            {!analysisComplete && !limitReached && (
              <div className="text-blue-400 animate-pulse">
                <span>{'> '}</span>
                <span className="inline-block">En cours d'analyse...</span>
              </div>
            )}
            
            {limitReached && (
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded text-yellow-200">
                <p>Réinitialisation dans: {countdownTime}</p>
              </div>
            )}
          </div>
          
          {analysisComplete && (
            <div className="mt-4 text-center">
              <p className="text-green-400">Analyse terminée avec succès!</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Always render children - the background mode will handle updates without UI disruption
  return <>{children}</>;
};

export default AnalysisController;

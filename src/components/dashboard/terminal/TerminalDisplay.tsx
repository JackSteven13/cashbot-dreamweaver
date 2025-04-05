
import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Sparkles, Clock, AlertOctagon } from 'lucide-react';

interface TerminalDisplayProps {
  showAnalysis: boolean;
  terminalLines: string[];
  analysisComplete: boolean;
  limitReached?: boolean;
  countdownTime?: string;
}

export const TerminalDisplay: React.FC<TerminalDisplayProps> = ({
  showAnalysis,
  terminalLines,
  analysisComplete,
  limitReached = false,
  countdownTime = '00:00:00'
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Scroll to bottom of terminal when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    
    if (showAnalysis && !isVisible) {
      setIsVisible(true);
    } else if (!showAnalysis && isVisible && !limitReached) {
      // Add a small delay before hiding to allow for animations
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [terminalLines, showAnalysis, isVisible, limitReached]);

  if (!isVisible) return null;
  
  return (
    <div 
      ref={terminalRef}
      className={`bg-black/70 p-3 rounded-md my-4 h-48 overflow-y-auto font-mono text-sm scrollbar-thin scrollbar-thumb-[#9b87f5] scrollbar-track-transparent transition-all duration-300 ${showAnalysis ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex items-center mb-2">
        <Terminal size={14} className="mr-2 text-[#9b87f5]" />
        <span className="text-[#9b87f5] font-bold">Stream Genius Terminal</span>
      </div>
      
      {terminalLines.map((line, index) => (
        <div 
          key={index} 
          className={`mb-1 ${index === terminalLines.length - 1 ? 'terminal-text' : ''}`}
        >
          <span className="text-green-500">$</span> 
          <span className={index === terminalLines.length - 2 ? 'text-yellow-300' : 'text-white'}>
            {line}
          </span>
          
          {index === terminalLines.length - 1 && line.includes("succès") && (
            <span className="ml-2 text-green-400">✓</span>
          )}
          
          {/* Display warning icon for limit reached messages */}
          {index === terminalLines.length - 1 && line.includes("hors-service") && (
            <span className="ml-2 text-amber-400">⚠</span>
          )}
        </div>
      ))}
      
      {/* Display countdown timer when limit is reached */}
      {limitReached && (
        <div className="mt-4 bg-red-500/20 border border-red-400/30 p-2 rounded">
          <div className="flex items-center mb-2">
            <AlertOctagon size={16} className="text-red-400 mr-2" />
            <span className="text-red-300">Bot hors-service</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={14} className="text-amber-400 mr-1" />
              <span className="text-amber-300 text-xs">Prochaine session dans:</span>
            </div>
            <span className="font-bold text-white bg-black/50 px-2 py-1 rounded border border-amber-500/30 text-xs">
              {countdownTime}
            </span>
          </div>
        </div>
      )}
      
      {/* Animation for the last step - funds added */}
      {analysisComplete && !limitReached && terminalLines.length > 0 && terminalLines[terminalLines.length - 1].includes("succès") && (
        <div className="mt-2 text-green-300 font-bold animate-pulse">
          <span className="inline-block mr-2">
            <Sparkles size={14} className="inline mr-1" />
            Fonds ajoutés:
          </span>
          <span className="balance-increase inline-block">+{(Math.random() * 0.5 + 0.1).toFixed(2)}€</span>
        </div>
      )}
      
      {/* Blinking cursor effect */}
      {!analysisComplete && !limitReached && (
        <span className="blink-cursor"></span>
      )}
    </div>
  );
};

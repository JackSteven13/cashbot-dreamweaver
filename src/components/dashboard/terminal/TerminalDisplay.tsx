
import React, { useRef, useEffect } from 'react';
import { Terminal, Sparkles } from 'lucide-react';

interface TerminalDisplayProps {
  showAnalysis: boolean;
  terminalLines: string[];
  analysisComplete: boolean;
}

export const TerminalDisplay: React.FC<TerminalDisplayProps> = ({
  showAnalysis,
  terminalLines,
  analysisComplete
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of terminal when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  if (!showAnalysis) return null;
  
  return (
    <div 
      ref={terminalRef}
      className="bg-black/70 p-3 rounded-md my-4 h-48 overflow-y-auto font-mono text-sm scrollbar-thin scrollbar-thumb-[#9b87f5] scrollbar-track-transparent"
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
          
          {/* Animation for the last step - funds added */}
          {analysisComplete && index === terminalLines.length - 1 && (
            <div className="mt-2 text-green-300 font-bold animate-pulse">
              <span className="inline-block mr-2">
                <Sparkles size={14} className="inline mr-1" />
                Fonds ajoutés:
              </span>
              <span className="balance-increase inline-block">+{(Math.random() * 0.5 + 0.1).toFixed(2)}€</span>
            </div>
          )}
        </div>
      ))}
      
      {/* Blinking cursor effect */}
      {!analysisComplete && (
        <span className="blink-cursor"></span>
      )}
    </div>
  );
};

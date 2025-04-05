
import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Sparkles, Clock, AlertOctagon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [isRemoving, setIsRemoving] = useState(false);
  const isMobile = useIsMobile();
  
  // Scroll to bottom of terminal when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    
    if (showAnalysis && !isVisible) {
      // Make visible immediately when showing analysis
      setIsRemoving(false);
      setIsVisible(true);
    } else if (!showAnalysis && isVisible && !limitReached) {
      // Start removal animation when hiding
      setIsRemoving(true);
      
      // Add a small delay before completely hiding the component
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [terminalLines, showAnalysis, isVisible, limitReached]);

  // Don't render anything if not visible
  if (!isVisible) return null;
  
  return (
    <div 
      ref={terminalRef}
      className={`bg-black/70 p-2.5 rounded-md my-3 ${isMobile ? 'h-36' : 'h-48'} overflow-y-auto font-mono ${isMobile ? 'text-xs' : 'text-sm'} scrollbar-thin scrollbar-thumb-[#9b87f5] scrollbar-track-transparent transition-all duration-300 
        ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
    >
      <div className="flex items-center mb-1.5">
        <Terminal size={isMobile ? 12 : 14} className="mr-1.5 text-[#9b87f5]" />
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
            <span className="ml-1.5 text-green-400">✓</span>
          )}
          
          {/* Display warning icon for limit reached messages */}
          {index === terminalLines.length - 1 && line.includes("hors-service") && (
            <span className="ml-1.5 text-amber-400">⚠</span>
          )}
        </div>
      ))}
      
      {/* Display countdown timer when limit is reached */}
      {limitReached && (
        <div className="mt-3 bg-red-500/20 border border-red-400/30 p-1.5 rounded">
          <div className="flex items-center mb-1">
            <AlertOctagon size={isMobile ? 14 : 16} className="text-red-400 mr-1.5" />
            <span className="text-red-300">Bot hors-service</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={isMobile ? 12 : 14} className="text-amber-400 mr-1" />
              <span className="text-amber-300 text-xs">Prochaine session:</span>
            </div>
            <span className="font-bold text-white bg-black/50 px-1.5 py-0.5 rounded border border-amber-500/30 text-xs">
              {countdownTime}
            </span>
          </div>
        </div>
      )}
      
      {/* Animation for the last step - funds added */}
      {analysisComplete && !limitReached && terminalLines.length > 0 && terminalLines[terminalLines.length - 1].includes("succès") && (
        <div className="mt-2 text-green-300 font-bold animate-pulse">
          <span className="inline-block mr-1.5">
            <Sparkles size={isMobile ? 12 : 14} className="inline mr-1" />
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


import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import TerminalOutput from './TerminalOutput';

interface TerminalOverlayProps {
  lines: string[];
  isComplete?: boolean;
  isLimitReached?: boolean;
  countdownTime?: string;
  isDismissable?: boolean;
}

const TerminalOverlay: React.FC<TerminalOverlayProps> = ({
  lines,
  isComplete = false,
  isLimitReached = false,
  countdownTime = '00:00:00',
  isDismissable = false
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [outputs, setOutputs] = useState<Array<{text: string; type: string}>>([]);
  
  // Convert lines to terminal output format
  useEffect(() => {
    const formattedOutputs = lines.map((line, index) => {
      // Determine the type of output based on content
      let type = 'info';
      
      if (line.toLowerCase().includes('erreur') || line.toLowerCase().includes('échec')) {
        type = 'warning';
      } else if (
        line.toLowerCase().includes('succès') || 
        line.toLowerCase().includes('réussi') || 
        line.toLowerCase().includes('terminé')
      ) {
        type = 'success';
      } else if (index === 0) {
        type = 'system'; // First line is usually system info
      }
      
      return { text: line, type };
    });
    
    // Add new outputs with a delay to create typing effect
    const addOutputsWithDelay = async () => {
      for (let i = 0; i < formattedOutputs.length; i++) {
        if (i >= outputs.length) {
          await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 300));
          setOutputs(prev => [...prev, formattedOutputs[i]]);
        }
      }
    };
    
    addOutputsWithDelay();
  }, [lines]);
  
  // Handle dismissal
  const handleDismiss = () => {
    if (isDismissable) {
      setFadeOut(true);
      setTimeout(() => {
        // Trigger the dismiss event
        window.dispatchEvent(new CustomEvent('terminal:dismiss'));
      }, 500);
    }
  };
  
  // Add activity animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (overlayRef.current && !isComplete && !fadeOut) {
        overlayRef.current.classList.toggle('terminal-pulse');
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isComplete, fadeOut]);
  
  // Auto-dismiss after completion
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isComplete && !isLimitReached) {
      timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
    }
    
    return () => clearTimeout(timer);
  }, [isComplete, isLimitReached]);
  
  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className={`w-11/12 md:w-3/4 lg:w-2/3 max-w-2xl bg-gray-900 border border-blue-900/50 rounded-lg shadow-lg p-4 max-h-[80vh] overflow-auto transition-all duration-500 ${
        fadeOut ? 'scale-95' : 'scale-100'
      }`}>
        <div className="flex items-center justify-between mb-4 border-b border-blue-900/30 pb-2">
          <div className="flex items-center space-x-2 text-blue-400">
            <div className={`h-3 w-3 rounded-full ${isComplete ? 'bg-green-500' : isLimitReached ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}></div>
            <h3 className="font-mono font-medium">
              {isComplete ? 'Analyse terminée' : isLimitReached ? 'Limite atteinte' : 'Analyse en cours...'}
            </h3>
          </div>
          {isDismissable && (
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
              <span className="sr-only">Fermer</span>
            </button>
          )}
        </div>
        
        <div className="h-64 bg-gray-950 rounded border border-gray-800 p-3 font-mono text-sm overflow-auto">
          <TerminalOutput outputs={outputs} scrollToBottom={true} />
          
          {/* Simulated cursor blinking when not complete */}
          {!isComplete && !isLimitReached && (
            <div className="h-4 w-2 bg-blue-500 opacity-70 inline-block animate-blink mt-1"></div>
          )}
        </div>
        
        {isLimitReached && (
          <div className="mt-4 text-center">
            <p className="text-amber-400 text-sm">Réinitialisation dans: <span className="text-white font-mono">{countdownTime}</span></p>
          </div>
        )}
        
        <div className="mt-4 text-right">
          <button
            onClick={handleDismiss}
            disabled={!isDismissable}
            className={`px-4 py-1.5 rounded text-sm font-medium ${
              isDismissable 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            } transition-colors`}
          >
            {isComplete ? 'Fermer' : 'Attendre...'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminalOverlay;

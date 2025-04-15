
import React, { useEffect, useRef } from 'react';

interface TerminalOutputProps {
  outputs: Array<{text: string, type: string}>;
  scrollToBottom?: boolean;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ outputs, scrollToBottom = false }) => {
  const outputRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new outputs appear
  useEffect(() => {
    if (scrollToBottom && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs, scrollToBottom]);
  
  return (
    <div ref={outputRef} className="font-mono text-xs space-y-1 overflow-auto max-h-full">
      {outputs.map((output, index) => (
        <div 
          key={`term-output-${index}`}
          className={`terminal-line ${
            output.type === 'system' 
              ? 'text-gray-400' 
              : output.type === 'warning' 
                ? 'text-amber-400' 
                : output.type === 'success' 
                  ? 'text-green-400' 
                  : 'text-blue-400'
          } animate-fade-in`}
        >
          <span className="mr-2">{
            output.type === 'system' 
              ? '[SYS]' 
              : output.type === 'warning' 
                ? '[AVERTISSEMENT]' 
                : output.type === 'success' 
                  ? '[OK]' 
                  : '[INFO]'
          }</span>
          <span>{output.text}</span>
        </div>
      ))}
    </div>
  );
};

export default TerminalOutput;

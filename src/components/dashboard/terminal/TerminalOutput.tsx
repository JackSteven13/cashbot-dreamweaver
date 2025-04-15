
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
  
  // Get appropriate icon based on message type
  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return '🖥️';
      case 'warning': return '⚠️';
      case 'success': return '✓';
      case 'error': return '❌';
      default: return '📊';
    }
  };
  
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
                  : output.type === 'error'
                    ? 'text-red-400'
                    : 'text-blue-400'
          } opacity-0 animate-fade-in`}
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
          <span className="mr-2 select-none">{getIcon(output.type)}</span>
          <span className="terminal-typing" style={{ animationDelay: `${index * 100 + 50}ms` }}>
            {output.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TerminalOutput;

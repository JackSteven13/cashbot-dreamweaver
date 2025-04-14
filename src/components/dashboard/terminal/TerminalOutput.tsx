
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TerminalOutputProps {
  outputs: Array<{text: string; type: string}>;
  scrollToBottom?: boolean;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ outputs, scrollToBottom = false }) => {
  const outputRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (scrollToBottom && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs, scrollToBottom]);
  
  // Generate timestamp for each line
  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };
  
  // Color coding based on message type
  const getClassForType = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'success':
        return 'text-green-500';
      case 'system':
        return 'text-purple-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-slate-300';
    }
  };
  
  return (
    <div ref={outputRef} className="h-full overflow-y-auto space-y-1 font-mono text-xs">
      {outputs.map((output, index) => (
        <div key={index} className="flex items-start opacity-90 hover:opacity-100 transition-opacity">
          <span className="text-slate-500 mr-2">[{getTimestamp()}]</span>
          <span className={cn("flex-1", getClassForType(output.type))}>
            {output.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TerminalOutput;

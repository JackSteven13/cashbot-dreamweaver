
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TerminalOutputProps {
  outputs: Array<{text: string, type: string}>;
  scrollToBottom?: boolean;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ 
  outputs,
  scrollToBottom = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollToBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [outputs, scrollToBottom]);
  
  const getTextColor = (type: string): string => {
    switch (type) {
      case 'system':
        return 'text-blue-400';
      case 'info':
        return 'text-slate-300';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-amber-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-300';
    }
  };
  
  const getTimestamp = (): string => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };
  
  return (
    <div ref={containerRef} className="space-y-1 overflow-y-auto h-full">
      {outputs.map((output, index) => (
        <div key={index} className="flex">
          <span className="text-slate-500 mr-2">[{getTimestamp()}]</span>
          <span className={cn(getTextColor(output.type))}>{output.text}</span>
        </div>
      ))}
    </div>
  );
};

export default TerminalOutput;

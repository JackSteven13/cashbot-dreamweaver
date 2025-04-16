
import React from 'react';
import { cn } from '@/lib/utils';

interface StatPanelProps {
  value: string;
  label: string;
  className?: string;
}

const StatPanel = ({ value, label, className }: StatPanelProps) => {
  return (
    <div className={cn(
      "bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-border/50",
      "transition-all duration-300 ease-in-out hover:border-primary/20",
      className
    )}>
      <div className="text-lg font-bold text-foreground truncate">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1 truncate">
        {label}
      </div>
    </div>
  );
};

export default StatPanel;

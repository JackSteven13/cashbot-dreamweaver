
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
      "bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border/50",
      "transition-all duration-300 ease-in-out hover:border-primary/20",
      className
    )}>
      <div className="text-2xl font-bold text-foreground">
        {value}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
};

export default StatPanel;

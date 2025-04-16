
import React from 'react';
import { cn } from '@/lib/utils';

interface StatPanelProps {
  value: string | number;
  label: string;
  className?: string;
}

const StatPanel = ({ value, label, className }: StatPanelProps) => {
  return (
    <div className={cn("glass-panel p-3 sm:p-6 rounded-xl text-center", className)}>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate transition-all duration-5000">
        {value}
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

export default StatPanel;

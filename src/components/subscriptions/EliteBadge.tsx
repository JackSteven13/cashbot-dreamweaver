
import React from 'react';
import { Crown } from 'lucide-react';

interface EliteBadgeProps {
  className?: string;
}

const EliteBadge: React.FC<EliteBadgeProps> = ({ className }) => {
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 ${className}`}>
      <Crown className="h-3 w-3 mr-1" />
      Élite
    </div>
  );
};

export default EliteBadge;

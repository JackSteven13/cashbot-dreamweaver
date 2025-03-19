
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemInfoProps {
  isNewUser: boolean;
  onFeedbackClick: () => void;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({ isNewUser, onFeedbackClick }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <div className="flex space-x-1 mr-2">
          <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <div className="h-2.5 w-2.5 bg-blue-400 rounded-full"></div>
          <div className="h-2.5 w-2.5 bg-indigo-400 rounded-full"></div>
        </div>
        <h3 className="text-lg font-bold text-white">
          {isNewUser ? "CashBot • Bienvenue" : "CashBot • Système actif"}
        </h3>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-xs text-blue-200 hover:text-white hover:bg-blue-800/50 flex items-center gap-1.5"
        onClick={onFeedbackClick}
      >
        <MessageCircle className="h-4 w-4" />
        Feedback
      </Button>
    </div>
  );
};

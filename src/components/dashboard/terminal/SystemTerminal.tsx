
import React, { useState } from 'react';
import { FeedbackDialog } from './FeedbackDialog';
import { SystemInfo } from './SystemInfo';
import { SystemProgressBar } from './SystemProgressBar';
import { SessionCountdown } from './SessionCountdown';
import { NewUserGuide } from './NewUserGuide';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';

interface SystemTerminalProps {
  isNewUser: boolean;
  dailyLimit: number;
  subscription: string;
  remainingSessions: number | string;
  referralCount: number;
  displayBalance: number;
  referralBonus: number;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({
  isNewUser,
  dailyLimit,
  subscription,
  remainingSessions,
  displayBalance,
  referralBonus,
}) => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  // Utiliser notre hook pour le compte à rebours
  const { timeRemaining, isCountingDown } = useSessionCountdown(
    typeof remainingSessions === 'number' ? 1 - remainingSessions : 0, 
    subscription
  );
  
  // Calculer le pourcentage de progression vers la limite journalière
  const limitPercentage = Math.min(100, (displayBalance / dailyLimit) * 100);

  return (
    <div className="w-full h-full">
      <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl shadow-xl border border-indigo-700/50 p-6 text-white overflow-hidden relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjEuOSAyLjEgMi4xdjI3LjhjMCAxLjItLjkgMi4xLTIuMSAyLjFIOFYxOGgyOHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        {/* Header with system status and feedback button */}
        <SystemInfo 
          isNewUser={isNewUser} 
          onFeedbackClick={() => setShowFeedbackDialog(true)} 
        />
        
        {/* Progress bar for daily limit */}
        <SystemProgressBar 
          displayBalance={displayBalance} 
          dailyLimit={dailyLimit} 
          limitPercentage={limitPercentage} 
        />
        
        {/* Countdown timer if applicable */}
        {isCountingDown && (
          <SessionCountdown timeRemaining={timeRemaining} />
        )}
        
        {/* New user guide */}
        {isNewUser && <NewUserGuide />}
      </div>
      
      {/* Feedback dialog */}
      <FeedbackDialog
        open={showFeedbackDialog}
        feedback={feedback}
        setFeedback={setFeedback}
        onClose={() => setShowFeedbackDialog(false)}
        onSubmit={() => {
          if (feedback.trim()) {
            setFeedback('');
            setShowFeedbackDialog(false);
          }
        }}
      />
    </div>
  );
};

export default SystemTerminal;

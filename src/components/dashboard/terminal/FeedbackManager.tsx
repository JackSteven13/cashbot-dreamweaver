
import React, { useState } from 'react';
import { FeedbackDialog } from './FeedbackDialog';
import { SystemInfo } from './SystemInfo';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeedbackManagerProps {
  isNewUser: boolean;
}

export const FeedbackManager: React.FC<FeedbackManagerProps> = ({ isNewUser }) => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'mb-16' : ''}`}>
      <SystemInfo 
        isNewUser={isNewUser} 
        onFeedbackClick={() => setShowFeedbackDialog(true)} 
      />
      
      <FeedbackDialog
        open={showFeedbackDialog}
        feedback={feedback}
        setFeedback={setFeedback}
        onClose={() => setShowFeedbackDialog(false)}
        onSubmit={() => {
          setFeedback('');
          setShowFeedbackDialog(false);
        }}
      />
    </div>
  );
};

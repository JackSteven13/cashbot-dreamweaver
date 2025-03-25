
import React, { useState } from 'react';
import { FeedbackDialog } from './FeedbackDialog';
import { SystemInfo } from './SystemInfo';

interface FeedbackManagerProps {
  isNewUser: boolean;
}

export const FeedbackManager: React.FC<FeedbackManagerProps> = ({ isNewUser }) => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');

  return (
    <>
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
          if (feedback.trim()) {
            setFeedback('');
            setShowFeedbackDialog(false);
          }
        }}
      />
    </>
  );
};

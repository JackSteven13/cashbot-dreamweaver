
import React from 'react';
import { ProTrialBanner, ProTrialActive } from './ProTrialBanner';

interface ProTrialManagerProps {
  subscription: string;
  isPromoActivated: boolean;
  activateProTrial: () => void;
}

export const ProTrialManager: React.FC<ProTrialManagerProps> = ({ 
  subscription, 
  isPromoActivated, 
  activateProTrial 
}) => {
  return (
    <>
      {subscription === 'freemium' && !isPromoActivated && (
        <ProTrialBanner onClick={activateProTrial} />
      )}
      
      {isPromoActivated && <ProTrialActive />}
    </>
  );
};

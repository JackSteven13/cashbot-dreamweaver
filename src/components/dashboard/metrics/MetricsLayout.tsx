
import React from 'react';
import ProTrialButton from './ProTrialButton';

interface MetricsLayoutProps {
  mainContent: React.ReactNode;
  sideContent: React.ReactNode;
  subscription: string;
  onActivateProTrial: () => void;
}

const MetricsLayout = ({ 
  mainContent, 
  sideContent, 
  subscription,
  onActivateProTrial 
}: MetricsLayoutProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {mainContent}
      </div>
      <div className="space-y-8">
        <ProTrialButton 
          subscription={subscription} 
          onActivate={onActivateProTrial} 
        />
        {sideContent}
      </div>
    </div>
  );
};

export default MetricsLayout;

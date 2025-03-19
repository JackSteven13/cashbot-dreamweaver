
import React from 'react';

interface MetricsLayoutProps {
  mainContent: React.ReactNode;
  sideContent: React.ReactNode;
  subscription: string;
  onActivateProTrial: () => void;
}

const MetricsLayout = ({ 
  mainContent, 
  sideContent
}: MetricsLayoutProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {mainContent}
      </div>
      <div className="space-y-8">
        {sideContent}
      </div>
    </div>
  );
};

export default MetricsLayout;

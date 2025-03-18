
import React from 'react';

interface MetricsLayoutProps {
  mainContent: React.ReactNode;
  sideContent: React.ReactNode;
}

const MetricsLayout = ({ mainContent, sideContent }: MetricsLayoutProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {mainContent}
      </div>
      <div className="space-y-6">
        {sideContent}
      </div>
    </div>
  );
};

export default MetricsLayout;


import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MetricsLayoutProps {
  mainContent: React.ReactNode;
  sideContent: React.ReactNode;
}

const MetricsLayout = ({ mainContent, sideContent }: MetricsLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
      <div className={`lg:col-span-2 ${isMobile ? 'order-2' : ''}`}>
        {mainContent}
      </div>
      <div className={`space-y-3 md:space-y-6 ${isMobile ? 'order-1 mb-3' : ''}`}>
        {sideContent}
      </div>
    </div>
  );
};

export default MetricsLayout;

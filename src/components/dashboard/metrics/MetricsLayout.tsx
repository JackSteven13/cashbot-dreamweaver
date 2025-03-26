
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MetricsLayoutProps {
  mainContent: React.ReactNode;
  sideContent: React.ReactNode;
}

const MetricsLayout = ({ mainContent, sideContent }: MetricsLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className={`lg:col-span-2 ${isMobile ? 'order-2' : ''}`}>
        {mainContent}
      </div>
      <div className={`space-y-4 md:space-y-6 ${isMobile ? 'order-1' : ''}`}>
        {sideContent}
      </div>
    </div>
  );
};

export default MetricsLayout;

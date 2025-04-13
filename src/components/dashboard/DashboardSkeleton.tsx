
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => {
  return (
    <div className="py-6 px-4 md:px-6 space-y-6">
      {/* Header skeleton */}
      <div className="glass-panel p-6 rounded-xl">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-40" />
      </div>
      
      {/* Bot control panel skeleton */}
      <Skeleton className="w-full h-[126px] rounded-lg" />
      
      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        
        {/* Dashboard metrics skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[322px] rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

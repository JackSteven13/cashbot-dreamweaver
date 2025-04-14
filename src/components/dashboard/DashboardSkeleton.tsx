
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardSkeletonProps {
  username?: string;
}

const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ username = 'Utilisateur' }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center mr-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {/* User icon placeholder */}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{username}</span>
            </div>
            
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Tab skeleton */}
        <div className="mb-6 flex space-x-2">
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-24 rounded" />
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded" />
          <Skeleton className="h-40 rounded md:col-span-2" />
        </div>
        
        <div className="mt-6">
          <Skeleton className="h-64 rounded" />
        </div>
      </main>
    </div>
  );
};

export default DashboardSkeleton;

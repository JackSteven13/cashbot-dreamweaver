
import { ReactNode } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  username: string;
  subscription: string;
  selectedNavItem: string;
  setSelectedNavItem: (item: string) => void;
}

const DashboardLayout = ({
  children,
  username,
  subscription,
  selectedNavItem,
  setSelectedNavItem
}: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden cyberpunk-bg">
      <Sidebar 
        selectedNavItem={selectedNavItem} 
        setSelectedNavItem={setSelectedNavItem} 
      />
      
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0f0f23]">
        <DashboardHeader 
          username={username} 
          subscription={subscription} 
        />
        
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Sidebar 
        selectedNavItem={selectedNavItem} 
        setSelectedNavItem={setSelectedNavItem} 
      />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <DashboardHeader 
          username={username} 
          subscription={subscription} 
        />
        
        <main className={`flex-1 ${isMobile ? 'p-2.5 pt-4' : 'p-3 md:p-6'} overflow-x-hidden`}>
          {children}
        </main>

        {/* Bouton mobile pour retourner à l'accueil */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <Button 
            size="icon" 
            className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            onClick={() => navigate('/')}
          >
            <Home className="h-5 w-5" />
            <span className="sr-only">Retour à l'accueil</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

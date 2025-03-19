
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

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

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Sidebar 
        selectedNavItem={selectedNavItem} 
        setSelectedNavItem={setSelectedNavItem} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          username={username} 
          subscription={subscription} 
        />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Bouton mobile pour retourner à l'accueil */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            onClick={() => navigate('/')}
          >
            <Home className="h-6 w-6" />
            <span className="sr-only">Retour à l'accueil</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

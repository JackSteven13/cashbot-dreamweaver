
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, Settings, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardHeaderProps {
  username: string;
  subscription?: string;
  isNewUser?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  username,
  subscription = 'freemium',
  isNewUser = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          {isNewUser && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
              Nouveau
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center mr-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{username}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
            title="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/aide')}
            title="Aide"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSignOut}
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

import React from 'react';
import { AccountSwitcher } from '../auth/AccountSwitcher';
import { useUserSession } from '@/hooks/useUserSession';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { forceSignOut } from '@/utils/auth';
import { toast } from '@/components/ui/use-toast';

const DashboardHeader: React.FC = () => {
  const { session } = useUserSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await forceSignOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de votre compte."
      });
      navigate('/login');
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Erreur lors de la déconnexion",
        description: "Une erreur est survenue, veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="flex justify-between items-center px-4 py-3 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur">
      <div className="flex items-center gap-3">
        <img src="/streamgeniushq-logo-light.svg" alt="Stream Genius HQ Logo" className="h-8" />
        <h1 className="text-lg font-semibold">Tableau de bord</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Ajout du sélecteur de comptes */}
        <AccountSwitcher />
        
        <Button variant="outline" size="sm" onClick={handleLogout} className="bg-secondary/30 hover:bg-secondary/50">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;

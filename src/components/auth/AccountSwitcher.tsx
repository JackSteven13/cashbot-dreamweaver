
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, UserCircle2, Plus, History, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forceSignOut } from '@/utils/auth';

type SavedAccount = {
  id: string;
  email: string;
  lastLogin: Date;
};

export function AccountSwitcher() {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Charger les comptes sauvegardés depuis le localStorage
    const loadSavedAccounts = () => {
      try {
        const savedAccountsString = localStorage.getItem('saved_accounts');
        const savedAccounts = savedAccountsString ? JSON.parse(savedAccountsString) : [];
        setAccounts(savedAccounts);
      } catch (error) {
        console.error("Error loading saved accounts:", error);
        // En cas d'erreur, initialiser avec un tableau vide
        setAccounts([]);
      }
    };

    // Obtenir l'utilisateur actuel
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
      
      // Si l'utilisateur est connecté, mettre à jour la liste des comptes
      if (data.user) {
        updateAccountsList(data.user);
      }
    };

    loadSavedAccounts();
    getCurrentUser();
  }, []);

  // Mise à jour de la liste des comptes
  const updateAccountsList = (user: User) => {
    const existingAccounts = [...accounts];
    
    // Vérifier si ce compte existe déjà
    const existingAccountIndex = existingAccounts.findIndex(a => a.id === user.id);
    
    if (existingAccountIndex >= 0) {
      // Mettre à jour la date de dernière connexion
      existingAccounts[existingAccountIndex].lastLogin = new Date();
    } else {
      // Ajouter le nouveau compte
      existingAccounts.push({
        id: user.id,
        email: user.email || 'Utilisateur sans email',
        lastLogin: new Date()
      });
    }
    
    // Limiter à 5 comptes maximum, en gardant les plus récemment utilisés
    const updatedAccounts = existingAccounts
      .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
      .slice(0, 5);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('saved_accounts', JSON.stringify(updatedAccounts));
    setAccounts(updatedAccounts);
  };

  // Se déconnecter du compte actuel
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

  // Changer de compte (déconnexion puis redirection vers login)
  const handleSwitchAccount = () => {
    handleLogout();
  };

  // Supprimer un compte de la liste sauvegardée
  const handleRemoveAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedAccounts = accounts.filter(account => account.id !== id);
    localStorage.setItem('saved_accounts', JSON.stringify(updatedAccounts));
    setAccounts(updatedAccounts);
    
    toast({
      title: "Compte supprimé",
      description: "Ce compte a été retiré de votre liste de comptes enregistrés."
    });
  };

  if (!currentUser) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="secondary" 
          className="bg-secondary/30 hover:bg-secondary/50 flex items-center gap-2 px-3 h-9"
        >
          <UserCircle2 size={18} />
          <span className="max-w-[120px] truncate text-sm font-medium">
            {currentUser.email?.split('@')[0] || 'Utilisateur'}
          </span>
          <ChevronDown size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        <DropdownMenuLabel className="text-center pb-2">
          Gestion de comptes
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Compte actuel */}
        <DropdownMenuItem className="py-2 text-primary font-medium flex items-center gap-2">
          <UserCircle2 size={16} className="text-primary" />
          <div className="flex-1 truncate">
            {currentUser.email || 'Utilisateur sans email'}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Option pour ajouter un nouveau compte */}
        <DropdownMenuItem 
          className="py-2 flex items-center gap-2"
          onClick={handleSwitchAccount}
        >
          <Plus size={16} className="text-green-500" />
          <span>Connecter un autre compte</span>
        </DropdownMenuItem>
        
        {accounts.length > 1 && (
          <>
            <DropdownMenuLabel className="pt-2 pb-1 text-xs text-muted-foreground">
              Comptes récents
            </DropdownMenuLabel>
            
            {/* Liste des comptes récents (autres que le compte actuel) */}
            {accounts
              .filter(account => account.id !== currentUser.id)
              .map(account => (
                <DropdownMenuItem 
                  key={account.id} 
                  className="py-2 flex items-center gap-2"
                  onClick={handleSwitchAccount}
                >
                  <History size={16} className="text-blue-500" />
                  <div className="flex-1 truncate">{account.email}</div>
                </DropdownMenuItem>
              ))
            }
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Option de déconnexion */}
        <DropdownMenuItem 
          className="py-2 flex items-center gap-2 text-red-500"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

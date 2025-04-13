
import React, { useState, useEffect } from 'react';

interface DashboardHeaderProps {
  username: string;
  subscription?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ username: initialUsername, subscription = 'freemium' }) => {
  const [username, setUsername] = useState(initialUsername || localStorage.getItem('lastKnownUsername') || 'Utilisateur');
  
  // Écouter les événements de chargement du nom d'utilisateur
  useEffect(() => {
    const handleUsernameLoaded = (event: CustomEvent) => {
      const loadedUsername = event.detail?.username;
      if (loadedUsername && loadedUsername !== 'Utilisateur') {
        setUsername(loadedUsername);
      }
    };
    
    // Écouter aussi l'événement de chargement des données utilisateur
    const handleUserDataLoaded = (event: CustomEvent) => {
      const loadedUsername = event.detail?.username;
      if (loadedUsername && loadedUsername !== 'Utilisateur') {
        setUsername(loadedUsername);
      }
    };
    
    // Vérifier le localStorage au montage
    const storedUsername = localStorage.getItem('lastKnownUsername');
    if (storedUsername && storedUsername !== 'Utilisateur') {
      setUsername(storedUsername);
    }

    window.addEventListener('username:loaded', handleUsernameLoaded as EventListener);
    window.addEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    
    return () => {
      window.removeEventListener('username:loaded', handleUsernameLoaded as EventListener);
      window.removeEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    };
  }, []);
  
  // Mettre à jour quand initialUsername change
  useEffect(() => {
    if (initialUsername && initialUsername !== 'Utilisateur') {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  return (
    <div className="glass-panel p-6 rounded-xl">
      <h1 className="text-2xl md:text-3xl font-bold">
        Bonjour, {username}
      </h1>
      
      <p className="text-muted-foreground mt-1">
        Abonnement actif: <span className="font-medium text-foreground">{subscription}</span>
      </p>
    </div>
  );
};

export default DashboardHeader;

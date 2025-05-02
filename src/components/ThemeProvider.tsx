
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force le mode sombre dès le chargement initial
  React.useEffect(() => {
    // Appliquer directement les classes dark au document
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-theme-body');
    document.body.classList.remove('light-theme-body');
    
    // Ajouter un attribut data-theme pour la cohérence
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Fonction pour vérifier et réappliquer le thème sombre régulièrement
    const ensureDarkMode = () => {
      if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
      }
      if (!document.documentElement.hasAttribute('data-theme') || 
          document.documentElement.getAttribute('data-theme') !== 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      
      // Vérifier aussi la visibilité de l'application
      if (document.getElementById('root')?.childElementCount === 0) {
        console.warn('Application container empty, attempting recovery');
        window.location.reload();
      }
    };
    
    // Vérifier régulièrement que le thème sombre reste appliqué
    const intervalId = setInterval(ensureDarkMode, 1000);
    
    // Observer les changements de classe sur html
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          ensureDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Récupération en cas d'erreur dans l'application
    window.addEventListener('error', (event) => {
      console.error('Application error detected:', event.error);
      // Retry loading if necessary
      if (event.error?.message?.includes('DNS') || event.error?.message?.includes('network')) {
        setTimeout(() => window.location.reload(), 5000);
      }
    });
    
    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark" // Forcer le thème sombre
      enableSystem={false} // Désactiver la détection système
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

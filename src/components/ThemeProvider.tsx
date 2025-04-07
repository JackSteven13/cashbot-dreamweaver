
"use client";

import React, { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force le mode sombre dès le chargement
  useEffect(() => {
    // Appliquer directement les classes dark au document
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-theme-body');
    document.body.classList.remove('light-theme-body');
    
    // Ajouter un attribut data-theme pour la cohérence
    document.documentElement.setAttribute('data-theme', 'dark');
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

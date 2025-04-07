
"use client";

import React, { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Ajouter un effet pour appliquer des classes supplémentaires au body
  useEffect(() => {
    // Observer les changements d'attributs sur documentElement (pour détecter le changement de theme)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' && 
          mutation.attributeName === 'data-theme'
        ) {
          const isDarkMode = document.documentElement.classList.contains('dark');
          
          if (isDarkMode) {
            document.body.classList.add('dark-theme-body');
            document.body.classList.remove('light-theme-body');
          } else {
            document.body.classList.add('light-theme-body');
            document.body.classList.remove('dark-theme-body');
          }
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    // Initial setup
    if (document.documentElement.classList.contains('dark')) {
      document.body.classList.add('dark-theme-body');
    } else {
      document.body.classList.add('light-theme-body');
    }

    return () => observer.disconnect();
  }, []);

  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme={props.defaultTheme || "system"}
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

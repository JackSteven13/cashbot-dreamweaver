
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
  }, []);

  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

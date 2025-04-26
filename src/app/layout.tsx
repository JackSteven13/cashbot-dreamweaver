
import '../styles/globals.css';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import AuthProvider from '@/providers/AuthProvider';
import LogoutHandler from '@/components/Auth/LogoutHandler';

const interClassName = 'font-sans'; // Simplified font handling without Next.js font

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" className="dark">
      <body className={cn('min-h-screen bg-background dark:bg-[#060b14]', interClassName)}>
        <AuthProvider>
          {children}
          <LogoutHandler />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

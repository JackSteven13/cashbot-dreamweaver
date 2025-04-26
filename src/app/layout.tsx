
import '../styles/globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import AuthProvider from '@/providers/AuthProvider';
import LogoutHandler from '@/components/Auth/LogoutHandler';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Stream Genius',
  description: 'Application Stream Genius',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={cn('min-h-screen bg-background dark:bg-[#060b14]', inter.className)}>
        <AuthProvider>
          {children}
          <LogoutHandler />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

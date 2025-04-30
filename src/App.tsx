
import { AuthProvider } from './hooks/useAuth';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import useAuthProvider from './hooks/auth/useAuthProvider';

function AuthSecurityWrapper() {
  // Utiliser notre hook pour les vérifications de sécurité
  useAuthProvider();
  
  return <AppRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <AuthSecurityWrapper />
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;

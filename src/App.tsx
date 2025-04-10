
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { ToastNotification } from './components/ui/toast-notification';
import { Toaster } from '@/components/ui/toaster'; // On garde également l'ancien système pour compatibilité

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryProvider>
        <AppRoutes />
        <ToastNotification 
          position="top-right" 
          theme="dark"
          richColors={true}
          offset="1rem"
        />
        <Toaster /> {/* Conserver l'ancien système de notification pour compatibilité */}
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;

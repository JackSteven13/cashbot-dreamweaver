
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { ToastNotification } from './components/ui/toast-notification';
import { Toaster } from '@/components/ui/toaster'; // On garde également l'ancien système pour compatibilité

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryProvider>
        <Router>
          <AppRoutes />
          <ToastNotification 
            position="top-right" 
            theme="system"
            richColors={true}
            offset="1rem"
          />
          <Toaster /> {/* Conserver l'ancien système de notification pour compatibilité */}
        </Router>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;

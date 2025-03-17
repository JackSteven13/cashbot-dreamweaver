import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Offres from './pages/Offres';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

createRoot(document.getElementById("root")!).render(<App />);

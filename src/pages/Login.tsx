
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AuthCleanup from '@/components/auth/login/AuthCleanup';
import LoadingScreen from '@/components/auth/login/LoadingScreen';
import LoginContainer from '@/components/auth/login/LoginContainer';
import { useLoginSession } from '@/components/auth/login/useLoginSession';

const Login = () => {
  const location = useLocation();
  const { isCheckingSession, lastLoggedInEmail } = useLoginSession();

  // Si on vérifie encore la session, afficher un loader amélioré
  if (isCheckingSession) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AuthCleanup />
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-28 pb-12">
        <LoginContainer lastLoggedInEmail={lastLoggedInEmail} />
      </main>
    </div>
  );
};

export default Login;

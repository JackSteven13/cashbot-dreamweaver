
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { verifyAuth } from '@/utils/auth/verificationUtils';
import LoginForm from '@/components/auth/LoginForm';
import AuthLoadingState from '@/components/auth/AuthLoadingState';
import BackToHomeLink from '@/components/auth/BackToHomeLink';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const isAuthenticated = await verifyAuth();
        
        if (isAuthenticated) {
          console.log("User already authenticated, redirecting to dashboard");
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-12">
        {isCheckingSession ? (
          <AuthLoadingState />
        ) : (
          <>
            <LoginForm />
          </>
        )}
      </main>
      
      {!isCheckingSession && (
        <footer className="pb-6">
          <BackToHomeLink />
        </footer>
      )}
    </div>
  );
};

export default Login;

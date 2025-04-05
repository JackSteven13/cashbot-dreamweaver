
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AccessCodeVerification from '@/components/access/AccessCodeVerification';
import { storeReferralCode } from '@/utils/referral/referralLinks';
import { validateReferralCode } from '@/utils/referral/validationUtils';

const AccessGate = () => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier si le code est déjà validé au chargement
  useEffect(() => {
    const checkAccessCode = () => {
      const verified = localStorage.getItem('access_code_verified') === 'true';
      setIsVerified(verified);
      
      if (verified) {
        // Redirection vers la page appropriée
        const from = new URLSearchParams(location.search).get('from') || '/';
        navigate(from, { replace: true });
      }
    };
    
    checkAccessCode();
    
    // Re-vérifier si le localStorage change
    window.addEventListener('storage', checkAccessCode);
    return () => {
      window.removeEventListener('storage', checkAccessCode);
    };
  }, [navigate, location.search]);

  const handleVerificationSuccess = async (code: string) => {
    // Stocker le code comme code de parrainage également
    storeReferralCode(code);
    
    // Vérifier si le code est valide pour le parrainage
    await validateReferralCode(code);
    
    setIsVerified(true);
    
    // Redirection vers la page appropriée après validation
    const from = new URLSearchParams(location.search).get('from') || '/';
    navigate(from, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex items-start sm:items-center justify-center pt-16 sm:pt-20 md:pt-28 pb-8 sm:pb-12 px-4">
        {!isVerified && (
          <AccessCodeVerification onVerificationSuccess={handleVerificationSuccess} />
        )}
      </main>
    </div>
  );
};

export default AccessGate;

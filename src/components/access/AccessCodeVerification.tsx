
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Button from '@/components/Button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { REFERRAL_CODES_TABLE } from '@/integrations/supabase/types/referralCodes';

const ADMIN_ACCESS_CODE = '87878787'; // Code d'accès administrateur

interface AccessCodeVerificationProps {
  onVerificationSuccess: (code: string) => void;
}

const AccessCodeVerification = ({ onVerificationSuccess }: AccessCodeVerificationProps) => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [storedCode, setStoredCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier s'il y a déjà un code enregistré au chargement
  useEffect(() => {
    const savedCode = localStorage.getItem('access_code');
    if (savedCode) {
      setStoredCode(savedCode);
      
      // Si le code est déjà validé et qu'on n'est pas sur la page de login ou register, on peut procéder
      const isCodeVerified = localStorage.getItem('access_code_verified') === 'true';
      if (isCodeVerified && !location.pathname.includes('/login') && !location.pathname.includes('/register')) {
        onVerificationSuccess(savedCode);
      }
    }
  }, [location.pathname, onVerificationSuccess]);

  const handleVerifyAccessCode = async () => {
    if (accessCode.length !== 8) {
      toast({
        title: "Code incomplet",
        description: "Veuillez entrer un code d'accès à 8 chiffres",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Vérifier si c'est le code admin
      if (accessCode === ADMIN_ACCESS_CODE) {
        handleSuccessfulVerification(accessCode, true);
        return;
      }

      // Vérifier le code dans la base de données en contournant les types
      const { data, error } = await supabase
        .from(REFERRAL_CODES_TABLE)
        .select('*')
        .eq('code', accessCode)
        .single() as any;

      if (error) {
        throw new Error("Code d'accès invalide ou expiré");
      }

      handleSuccessfulVerification(accessCode);
    } catch (error) {
      toast({
        title: "Échec de la vérification",
        description: error instanceof Error ? error.message : "Code d'accès invalide. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };

  const handleSuccessfulVerification = (code: string, isAdmin = false) => {
    // Enregistrer le code vérifié en local
    localStorage.setItem('access_code', code);
    localStorage.setItem('access_code_verified', 'true');
    if (isAdmin) {
      localStorage.setItem('is_admin', 'true');
    }
    
    toast({
      title: "Vérification réussie",
      description: "Bienvenue sur Stream Genius",
    });

    // Notifier le parent du succès de la vérification
    onVerificationSuccess(code);
    
    setIsVerifying(false);
  };

  return (
    <div className="max-w-md w-full mx-auto p-4 sm:p-6 bg-background border border-border rounded-xl shadow-lg">
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="bg-primary/10 p-2 sm:p-3 rounded-full">
          <KeyRound size={24} className="text-primary" />
        </div>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">Accès sécurisé</h2>
      
      <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6">
        Veuillez entrer votre code d'accès à 8 chiffres pour continuer
      </p>
      
      {storedCode ? (
        <div className="mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-center mb-2">
            Vous avez déjà un code enregistré :
          </p>
          <div className="bg-secondary p-2 sm:p-3 rounded-md text-center font-mono text-base sm:text-lg">
            {storedCode.split('').map((digit, index) => (
              <span key={index} className="mx-0.5">{digit}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <InputOTP 
            maxLength={8} 
            value={accessCode} 
            onChange={setAccessCode}
            pattern="^[0-9]{1,8}$"
            className="mb-3 sm:mb-4 flex justify-center"
          >
            <InputOTPGroup className="gap-1 sm:gap-2">
              <InputOTPSlot index={0} className="w-8 h-9 sm:w-10 sm:h-12" />
              <InputOTPSlot index={1} className="w-8 h-9 sm:w-10 sm:h-12" />
              <InputOTPSlot index={2} className="w-8 h-9 sm:w-10 sm:h-12" />
              <InputOTPSlot index={3} className="w-8 h-9 sm:w-10 sm:h-12" />
              <InputOTPSlot index={4} className="w-8 h-9 sm:w-10 sm:h-12" />
              <InputOTPSlot index={5} className="w-8 h-9 sm:w-10 sm:h-12" />
              <InputOTPSlot index={6} className="w-8 h-9 sm:w-10 sm:h-12" />
              <InputOTPSlot index={7} className="w-8 h-9 sm:w-10 sm:h-12" />
            </InputOTPGroup>
          </InputOTP>
          
          <p className="text-xs text-muted-foreground mb-3 sm:mb-4 text-center px-2">
            Ce code vous a été communiqué par la personne qui vous a parrainé
          </p>
        </div>
      )}
      
      <Button
        onClick={handleVerifyAccessCode}
        fullWidth
        size="lg"
        isLoading={isVerifying}
        disabled={isVerifying || (!storedCode && accessCode.length !== 8)}
        className="group h-10 sm:h-12 text-sm sm:text-base"
      >
        {isVerifying ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            Continuer
            <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center mt-4 sm:mt-6 px-2">
        En continuant, vous acceptez les <a href="/terms" className="underline hover:text-primary">termes et conditions</a> de Stream Genius
      </p>
    </div>
  );
};

export default AccessCodeVerification;

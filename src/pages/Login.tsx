
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, LogIn } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Button from '@/components/Button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const Login = () => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [storedCode, setStoredCode] = useState<string | null>(null);
  const navigate = useNavigate();

  // Vérifier s'il y a déjà un code enregistré au chargement
  useEffect(() => {
    const savedCode = localStorage.getItem('access_code');
    if (savedCode) {
      setStoredCode(savedCode);
    }
  }, []);

  const handleVerifyAccessCode = async () => {
    if (!accessCode && !storedCode) {
      toast({
        title: "Code manquant",
        description: "Veuillez entrer un code d'accès",
        variant: "destructive",
      });
      return;
    }

    const codeToVerify = accessCode || storedCode;
    if (codeToVerify && codeToVerify.length !== 8) {
      toast({
        title: "Code incomplet",
        description: "Le code d'accès doit avoir 8 chiffres",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    // Simulate login validation
    setTimeout(() => {
      // Store the code as verified
      if (codeToVerify) {
        localStorage.setItem('access_code', codeToVerify);
        localStorage.setItem('access_code_verified', 'true');
      }
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Stream Genius",
      });

      // Redirect to dashboard
      navigate('/dashboard');
      
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <LogIn size={24} className="text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login form would go here */}
          <div className="grid gap-4">
            <Button
              onClick={handleVerifyAccessCode}
              fullWidth
              size="lg"
              isLoading={isVerifying}
              className="group"
            >
              {isVerifying ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Connexion
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Pas encore inscrit ?{" "}
              <Link to="/register" className="text-primary underline hover:text-primary/80">
                Créer un compte
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

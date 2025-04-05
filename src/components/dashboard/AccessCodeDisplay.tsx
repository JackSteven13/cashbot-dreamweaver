
import { useState, useEffect } from 'react';
import { Copy, CheckCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const AccessCodeDisplay = () => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const storedCode = localStorage.getItem('access_code');
    if (storedCode) {
      setAccessCode(storedCode);
    }
  }, []);
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopied(true);
    toast({
      title: "Code copié !",
      description: "Le code d'accès a été copié dans le presse-papier",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  if (!accessCode) return null;
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Votre code d'accès et de parrainage
        </CardTitle>
        <CardDescription>
          Partagez ce code avec vos amis pour qu'ils puissent accéder à la plateforme et être parrainés par vous
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="bg-secondary p-3 rounded-md font-mono text-lg tracking-wider text-center flex-1 w-full">
            {accessCode.split('').map((digit, index) => (
              <span key={index} className="mx-0.5">{digit}</span>
            ))}
          </div>
          <Button 
            variant="outline" 
            onClick={handleCopyCode} 
            className="w-full sm:w-auto"
            disabled={copied}
          >
            {copied ? <CheckCheck className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copié !" : "Copier le code"}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          <span className="font-medium">Comment ça marche :</span> Ce code sert à la fois d'accès à la plateforme et de lien entre vous et vos filleuls. Pour chaque personne qui s'inscrit avec ce code, vous recevrez une commission sur leurs abonnements.
        </p>
      </CardContent>
    </Card>
  );
};

export default AccessCodeDisplay;

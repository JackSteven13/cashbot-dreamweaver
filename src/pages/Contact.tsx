
import React from 'react';
import { Mail, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { useState } from 'react';

const Contact = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const contactEmail = "user@streamgenius.fr";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail)
      .then(() => {
        setCopied(true);
        toast({
          title: "Adresse email copiée",
          description: "L'adresse email a été copiée dans votre presse-papiers.",
        });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Erreur lors de la copie: ', err);
        toast({
          title: "Erreur",
          description: "Impossible de copier l'adresse email.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 shadow-lg rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-3">Contactez-nous</h1>
            <p className="text-muted-foreground">
              Pour toute question ou assistance, n'hésitez pas à nous écrire
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Notre adresse email</p>
              <div className="flex items-center justify-center space-x-2">
                <p className="text-lg font-medium">{contactEmail}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copier</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <a 
              href={`mailto:${contactEmail}`} 
              className="w-full"
            >
              <Button className="w-full">
                Envoyer un email
              </Button>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;

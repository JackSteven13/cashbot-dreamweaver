
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Share2, Sparkles, TrendingUp } from 'lucide-react';

interface FirstTimeWelcomeProps {
  referralLink?: string;
}

const FirstTimeWelcome: React.FC<FirstTimeWelcomeProps> = ({ referralLink = "" }) => {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('welcome');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (referralLink && navigator.clipboard) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('welcomeModalShown', 'true');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            <Sparkles className="h-6 w-6 inline-block mr-2 text-blue-500" />
            Bienvenue !
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Découvrez comment maximiser vos gains dès maintenant
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="welcome">Bienvenue</TabsTrigger>
            <TabsTrigger value="referral">Parrainage</TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="mt-4 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold flex items-center text-blue-700 dark:text-blue-300">
                <TrendingUp className="h-5 w-5 mr-2" />
                Comment générer des revenus
              </h3>
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-200">
                Cliquez sur le bouton "Lancer l'analyse" pour commencer à générer des revenus. 
                Avec un compte Freemium, vous pouvez effectuer 3 analyses par jour.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Pour de meilleurs résultats :</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Lancez une analyse au moins une fois par jour</li>
                <li>Parrainez vos amis pour gagner des commissions</li>
                <li>Consultez les offres premium pour augmenter vos gains</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="referral" className="mt-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
              <h3 className="font-semibold flex items-center text-green-700 dark:text-green-300">
                <Share2 className="h-5 w-5 mr-2" />
                Votre lien de parrainage
              </h3>
              <p className="mt-2 text-sm text-green-600 dark:text-green-200">
                Partagez ce lien avec vos amis et gagnez 15% de leurs revenus générés !
              </p>
              
              <div className="mt-3 flex">
                <input 
                  type="text" 
                  value={referralLink} 
                  readOnly 
                  className="flex-1 bg-white dark:bg-slate-800 text-sm rounded-l-md border border-green-300 dark:border-green-700 px-3 py-1.5"
                />
                <Button 
                  onClick={handleCopyLink} 
                  size="sm"
                  className="rounded-l-none bg-green-600 hover:bg-green-700"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="text-sm space-y-2">
              <h4 className="font-medium">Avantages du parrainage :</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>15% de commission sur les revenus de vos filleuls</li>
                <li>Commissions versées directement sur votre solde</li>
                <li>Nombre illimité de filleuls</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">Commencer l'aventure</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FirstTimeWelcome;


import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Contact = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState<string | null>(null);

  // Vérifier si l'utilisateur a un email stocké dans le localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem('contactEmail');
    const storedLastMessageTime = localStorage.getItem('lastMessageTime');
    
    if (storedEmail) {
      setFormData(prev => ({ ...prev, email: storedEmail }));
      
      // Vérifier si l'utilisateur est en période de cooldown
      if (storedLastMessageTime) {
        const lastTime = new Date(storedLastMessageTime);
        const now = new Date();
        const diffHours = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
          setCooldownActive(true);
          
          // Calculer le temps restant
          const hoursLeft = Math.floor(24 - diffHours);
          const minutesLeft = Math.floor((24 - diffHours - hoursLeft) * 60);
          setCooldownTime(`${hoursLeft}h ${minutesLeft}min`);
        }
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs du formulaire.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Utiliser la méthode invoke de Supabase pour appeler l'Edge Function
      const { data, error } = await supabase.functions.invoke('contact-messages', {
        method: 'POST',
        body: {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          path: 'submit'
        },
      });
      
      if (error) {
        console.error('Erreur lors de l\'appel à l\'Edge Function:', error);
        throw new Error('Erreur lors de l\'envoi du message');
      }
      
      if (!data || !data.success) {
        console.error('Réponse invalide de l\'Edge Function:', data);
        
        // Vérifier si c'est une erreur de cooldown
        if (data?.cooldown) {
          // Stocker le temps du dernier message
          setCooldownActive(true);
          throw new Error(data?.message || 'Vous ne pouvez envoyer qu\'un message toutes les 24 heures.');
        }
        
        throw new Error(data?.error || 'Erreur lors de l\'envoi du message');
      }
      
      // Stocker l'email et le temps du dernier message dans le localStorage
      localStorage.setItem('contactEmail', formData.email);
      localStorage.setItem('lastMessageTime', new Date().toISOString());
      
      setFormSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      
      toast({
        title: "Message envoyé",
        description: "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.",
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      if (error.message.includes('24 heures') || error.message.includes('Limite de message')) {
        setCooldownActive(true);
        
        // Calculer le temps approximatif restant
        const lastMessageTime = localStorage.getItem('lastMessageTime');
        if (lastMessageTime) {
          const lastTime = new Date(lastMessageTime);
          const now = new Date();
          const diffHours = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
          
          if (diffHours < 24) {
            const hoursLeft = Math.floor(24 - diffHours);
            const minutesLeft = Math.floor((24 - diffHours - hoursLeft) * 60);
            setCooldownTime(`${hoursLeft}h ${minutesLeft}min`);
          }
        }
        
        toast({
          title: "Limite atteinte",
          description: error.message || "Vous ne pouvez envoyer qu'un message toutes les 24 heures.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 shadow-lg rounded-xl p-8 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="absolute top-4 left-4 flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </Button>
          
          <div className="text-center mb-8 mt-6">
            <h1 className="text-2xl font-bold mb-3">Contactez-nous</h1>
            <p className="text-muted-foreground">
              Pour toute question ou assistance, n'hésitez pas à nous écrire
            </p>
          </div>
          
          {cooldownActive && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Limite de messages atteinte</AlertTitle>
              <AlertDescription>
                Vous ne pouvez envoyer qu'un message toutes les 24 heures.
                {cooldownTime && (
                  <div className="mt-2">
                    Vous pourrez envoyer un nouveau message dans <strong>{cooldownTime}</strong>.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {formSubmitted ? (
            <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Message envoyé !</h3>
                <p className="text-muted-foreground">
                  Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.
                </p>
              </div>
              
              {cooldownActive ? (
                <div className="text-center text-amber-600 dark:text-amber-400">
                  <p>Vous pourrez envoyer un nouveau message dans 24 heures.</p>
                  {cooldownTime && <p className="font-medium mt-1">Temps restant : {cooldownTime}</p>}
                </div>
              ) : (
                <Button 
                  onClick={() => setFormSubmitted(false)}
                  variant="outline"
                >
                  Envoyer un autre message
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={cooldownActive || isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={cooldownActive || isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Votre message..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    disabled={cooldownActive || isSubmitting}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-4"
                  disabled={cooldownActive || isSubmitting}
                >
                  {isSubmitting ? (
                    <>Envoi en cours...</>
                  ) : cooldownActive ? (
                    <>Limite atteinte</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
                
                {cooldownActive && (
                  <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-2">
                    Vous pourrez envoyer un nouveau message dans {cooldownTime || "24 heures"}.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;

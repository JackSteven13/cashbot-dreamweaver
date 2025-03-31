import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from "@/integrations/supabase/client";

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
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-messages/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Erreur détaillée:', result.error);
        throw new Error(result.error || 'Erreur lors de l\'envoi du message');
      }
      
      setFormSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      
      toast({
        title: "Message envoyé",
        description: "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
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
              
              <Button 
                onClick={() => setFormSubmitted(false)}
                variant="outline"
              >
                Envoyer un autre message
              </Button>
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
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Envoi en cours...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
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

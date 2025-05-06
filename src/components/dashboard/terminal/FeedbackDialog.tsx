import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackDialogProps {
  open: boolean;
  feedback: string;
  setFeedback: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  feedback,
  setFeedback,
  onClose,
  onSubmit
}) => {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Alternative implementation without Supabase Edge Function
      // Store feedback directly in the database or send via an API
      try {
        const { error } = await supabase.from('contact_messages').insert({
          name: 'User Feedback',
          email: 'feedback@stream-genius.com',
          message: feedback
        });
        
        if (error) {
          throw error;
        }
      } catch (e) {
        console.error('Error submitting feedback:', e);
        toast({
          title: "Une erreur est survenue",
          description: "Impossible d'envoyer votre retour. Veuillez réessayer plus tard.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Merci pour votre retour !",
        description: "Votre avis est important pour nous. Nous l'examinerons attentivement.",
      });
      
      onSubmit();
    } catch (err) {
      console.error('Exception when submitting feedback:', err);
      toast({
        title: "Une erreur est survenue",
        description: "Impossible d'envoyer votre retour. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'w-[90%] max-w-[95vw] p-4' : 'sm:max-w-md'} mx-auto bg-background border border-border`}>
        <DialogHeader className="space-y-1">
          <DialogTitle>Partagez votre expérience</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Votre avis nous est précieux pour améliorer Stream genius.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <textarea
            className="min-h-28 rounded-md border border-gray-300 p-2 text-sm w-full bg-white"
            placeholder="Partagez vos suggestions ou frustrations..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <DialogFooter className={`${isMobile ? 'flex-col space-y-2' : ''}`}>
          <Button variant="outline" onClick={onClose} className={isMobile ? 'w-full' : ''} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            className={isMobile ? 'w-full' : ''} 
            disabled={!feedback.trim() || isSubmitting}
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

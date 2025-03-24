
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

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
  const handleSubmit = () => {
    if (feedback.trim()) {
      toast({
        title: "Merci pour votre retour !",
        description: "Votre avis est important pour nous. Nous l'examinerons attentivement.",
      });
      onSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partagez votre expérience</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-500">
            Votre avis nous est précieux pour améliorer Stream genius. N'hésitez pas à nous faire part de vos suggestions ou frustrations.
          </p>
          <textarea
            className="min-h-24 rounded-md border border-gray-300 p-2 text-sm"
            placeholder="Partagez vos suggestions ou frustrations..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit}>Envoyer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

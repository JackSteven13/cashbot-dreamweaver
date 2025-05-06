
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

interface LoginButtonProps {
  isLoading: boolean;
}

export function LoginButton({ isLoading }: LoginButtonProps) {
  return (
    <Button 
      type="submit" 
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 py-6 text-base"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Connexion en cours...</span>
        </>
      ) : (
        <>
          <span>Se connecter</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

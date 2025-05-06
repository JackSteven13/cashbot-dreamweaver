
import * as React from "react";
import { AlertCircle, Info, WifiOff, Wifi } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DNSAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning"; // Removed "info" to match Alert component's allowed variants
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
}

export function DNSAlert({
  className,
  variant = "destructive",
  title,
  description,
  icon,
  action = "Aide",
  onAction,
  ...props
}: DNSAlertProps) {
  // Déterminer l'icône en fonction du variant
  const alertIcon = icon || (
    variant === "destructive" ? <AlertCircle className="h-5 w-5" /> : 
    variant === "warning" ? <AlertCircle className="h-5 w-5" /> : 
    <Info className="h-5 w-5" />
  );

  return (
    <Alert 
      variant={variant} 
      className={cn("flex items-center justify-between gap-4 transition-all duration-300", className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {alertIcon}
        <div>
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
        </div>
      </div>
      
      {action && onAction && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onAction}
          className="h-8 px-3 py-0 text-sm bg-slate-900/90 border-slate-700/50 hover:bg-slate-800"
        >
          {action}
        </Button>
      )}
    </Alert>
  );
}

export function NetworkStatusAlert({
  isOnline,
  onHelp,
  className,
  ...props
}: {
  isOnline?: boolean;
  onHelp?: () => void;
} & React.HTMLAttributes<HTMLDivElement>) {
  if (isOnline === undefined) return null;

  return isOnline ? (
    <DNSAlert
      variant="warning"
      icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
      title="Problème de DNS détecté. Essayez de vider votre cache DNS."
      action="Aide"
      onAction={onHelp}
      className={cn("bg-red-950/20 border-red-500/30", className)}
      {...props}
    />
  ) : (
    <DNSAlert
      variant="destructive"
      icon={<WifiOff className="h-5 w-5" />}
      title="Connexion internet non disponible"
      description="Vérifiez votre connexion et réessayez."
      action="Réessayer"
      onAction={() => window.location.reload()}
      className={cn("bg-red-950/20 border-red-500/30", className)}
      {...props}
    />
  );
}

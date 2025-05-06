
import * as React from "react";
import { AlertCircle, Info, WifiOff, Wifi } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DNSAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning";
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
  hidden?: boolean;
}

export function DNSAlert({
  className,
  variant = "destructive",
  title,
  description,
  icon,
  action = "Aide",
  onAction,
  hidden = false,
  ...props
}: DNSAlertProps) {
  if (hidden) return null;
  
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
  hidden = true,
  ...props
}: {
  isOnline?: boolean;
  onHelp?: () => void;
  hidden?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  // Toujours caché par défaut
  return null;
}

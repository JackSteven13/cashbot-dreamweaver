
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

// Ces composants retournent toujours null pour ne jamais s'afficher
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
  return null;
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
  return null;
}

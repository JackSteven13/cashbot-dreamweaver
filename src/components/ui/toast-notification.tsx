
import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";

export interface ToastNotificationProps {
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  className?: string;
  toastClassName?: string;
  theme?: "light" | "dark" | "system";
  closeButton?: boolean;
  offset?: string | number;
  duration?: number;
  richColors?: boolean;
  expandByDefault?: boolean; // We'll keep the prop in the interface but won't pass it to Sonner
}

export function ToastNotification({
  position = "top-right",
  className,
  toastClassName,
  theme = "system",
  closeButton = true,
  offset = "2rem",
  duration = 5000,
  richColors = true,
  expandByDefault = false, // Keep as prop but don't pass directly to Sonner
}: ToastNotificationProps) {
  return (
    <SonnerToaster
      position={position}
      toastOptions={{
        className: cn(
          "group toast-notification max-w-md md:max-w-sm bg-background border-border text-foreground",
          toastClassName
        ),
        style: {
          fontSize: "0.95rem",
          width: "auto",
          maxWidth: "90vw",
          minWidth: "min(270px, 90vw)",
        },
        duration: duration,
        descriptionClassName: "text-muted-foreground text-sm break-words",
        // We don't pass expandByDefault as it's not supported
      }}
      className={cn("toaster group", className)}
      theme={theme}
      closeButton={closeButton}
      richColors={richColors}
      offset={offset}
      expand={expandByDefault} // Use the "expand" property instead which is supported
    />
  );
}


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
        },
        duration: duration,
      }}
      className={cn("toaster group", className)}
      theme={theme}
      closeButton={closeButton}
      richColors={richColors}
      offset={offset}
    />
  );
}

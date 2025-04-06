
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
  expandByDefault?: boolean;
}

export function ToastNotification({
  position = "top-center",
  className,
  toastClassName,
  theme = "dark",
  closeButton = true,
  offset = "1.5rem",
  duration = 5000,
  richColors = true,
  expandByDefault = true,
}: ToastNotificationProps) {
  return (
    <SonnerToaster
      position={position}
      toastOptions={{
        className: cn(
          "group toast-notification font-medium border border-blue-500/30 bg-slate-900/95 text-white shadow-lg",
          toastClassName
        ),
        style: {
          fontSize: "0.95rem",
          width: "auto",
          maxWidth: "clamp(320px, 95vw, 420px)",
          minWidth: "clamp(300px, 90vw, 380px)",
          padding: "12px 16px",
          zIndex: 9999,
        },
        duration: duration,
        descriptionClassName: "text-gray-200 text-base break-words mt-1",
      }}
      className={cn("toaster group z-[9999]", className)}
      theme={theme}
      closeButton={closeButton}
      richColors={richColors}
      offset={offset}
      expand={expandByDefault}
    />
  );
}

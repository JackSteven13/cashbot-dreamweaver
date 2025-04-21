
import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";

export interface ToastNotificationProps {
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  className?: string;
  toastClassName?: string;
  theme?: "dark"; // Modifier le type pour n'accepter que "dark"
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
  theme = "dark", // Toujours en mode sombre
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
          "group toast-notification font-medium transition-colors duration-300",
          "border border-slate-700/50 bg-slate-900/95 text-white shadow-lg",
          toastClassName
        ),
        style: {
          fontSize: "0.95rem",
          width: "auto",
          maxWidth: "clamp(320px, 85vw, 420px)", // Réduit la largeur max sur mobile
          minWidth: "clamp(280px, 80vw, 320px)", // Réduit la largeur min sur mobile
          padding: "12px 16px",
          zIndex: 9999,
        },
        duration: duration,
        descriptionClassName: cn(
          "text-base break-words mt-1",
          "text-gray-200"
        ),
      }}
      className={cn("toaster group z-[9999]", className)}
      theme="dark"
      closeButton={closeButton}
      richColors={richColors}
      offset="2rem" // Augmenter l'offset pour éloigner du bord de l'écran
      expand={expandByDefault}
    />
  );
}

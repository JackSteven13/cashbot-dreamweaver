
import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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
  theme: toastTheme = "system",
  closeButton = true,
  offset = "1.5rem",
  duration = 5000,
  richColors = true,
  expandByDefault = true,
}: ToastNotificationProps) {
  const { theme: appTheme } = useTheme();
  
  // Determine the actual theme to use
  const effectiveTheme = toastTheme === "system" 
    ? appTheme 
    : toastTheme;

  return (
    <SonnerToaster
      position={position}
      toastOptions={{
        className: cn(
          "group toast-notification font-medium transition-colors duration-300",
          effectiveTheme === "dark" 
            ? "border border-blue-500/30 bg-slate-900/95 text-white shadow-lg" 
            : "border border-slate-200 bg-white text-slate-900 shadow-md",
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
        descriptionClassName: cn(
          "text-base break-words mt-1",
          effectiveTheme === "dark" ? "text-gray-200" : "text-gray-600"
        ),
      }}
      className={cn("toaster group z-[9999]", className)}
      theme={effectiveTheme}
      closeButton={closeButton}
      richColors={richColors}
      offset={offset}
      expand={expandByDefault}
    />
  );
}

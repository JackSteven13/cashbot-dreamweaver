
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Ajout de la classe destructive pour les toasts d'erreur
        const isError = variant === "destructive";
        
        return (
          <Toast 
            key={id} 
            {...props} 
            className={`toast-notification ${isError ? 'destructive bg-red-950/90 text-white border-red-700/50' : ''} 
              max-w-[90vw] md:max-w-md z-[9999] fixed shadow-lg 
              border border-slate-700/50 bg-slate-900/95`}
          >
            <div className="grid gap-1.5 w-full">
              {title && <ToastTitle className="text-sm font-semibold sm:text-base text-white">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs sm:text-sm break-words text-gray-200 w-full opacity-95">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-gray-300 hover:text-white" />
          </Toast>
        )
      })}
      <ToastViewport className="toast-viewport fixed top-0 z-[9999] flex flex-col items-center p-4 md:items-end gap-2 max-w-[100vw] w-full" />
    </ToastProvider>
  )
}

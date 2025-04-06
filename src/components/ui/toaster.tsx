
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
            className={`toast-notification ${isError ? 'destructive bg-red-950/90 text-white border-red-700/50' : ''} max-w-[94vw] z-[1000] md:max-w-md shadow-lg`}
          >
            <div className="grid gap-1.5 w-full">
              {title && <ToastTitle className="text-base font-semibold sm:text-lg">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm sm:text-base break-words text-gray-200 dark:text-gray-200 w-full opacity-95">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="toast-viewport fixed top-0 z-[1000] flex flex-col items-center w-full p-4 sm:items-end gap-2 max-w-[100vw]" />
    </ToastProvider>
  )
}


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
            className={`toast-notification ${isError ? 'destructive' : ''} max-w-[94vw] z-[1000] md:max-w-md`}
          >
            <div className="grid gap-1 w-full">
              {title && <ToastTitle className="text-base sm:text-lg font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm sm:text-base break-words text-gray-700 dark:text-gray-300">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="toast-viewport fixed top-0 z-50 flex flex-col items-center w-full p-4 md:items-end gap-2 max-w-[100vw]" />
    </ToastProvider>
  )
}

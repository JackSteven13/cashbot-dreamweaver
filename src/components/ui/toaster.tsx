
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
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="toast-notification">
            <div className="grid gap-1 w-full">
              {title && <ToastTitle className="text-base sm:text-lg">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm sm:text-base break-words">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="toast-viewport" />
    </ToastProvider>
  )
}

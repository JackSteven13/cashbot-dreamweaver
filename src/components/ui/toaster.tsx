
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
          <Toast key={id} {...props} className="toast-notification max-w-[94vw] z-[1000] md:max-w-md">
            <div className="grid gap-1 w-full">
              {title && <ToastTitle className="text-base sm:text-lg font-medium">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm sm:text-base break-words text-gray-700">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="toast-viewport fixed top-0 left-[50%] translate-x-[-50%] p-4 flex flex-col gap-2 w-full max-w-[95vw] md:max-w-md" />
    </ToastProvider>
  )
}

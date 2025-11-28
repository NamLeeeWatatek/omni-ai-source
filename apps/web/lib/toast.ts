import { toast as sonnerToast } from 'sonner'

/**
 * Centralized toast wrapper using Sonner
 * Provides a consistent API across the application
 */

// Main toast function (for custom JSX)
const toastFn = (message: string | React.ReactNode | ((t: any) => React.ReactNode), options?: any) => {
  // If it's a function, call it with a mock toast object for compatibility
  if (typeof message === 'function') {
    const mockToast = { id: Date.now().toString() }
    const content = message(mockToast)
    return sonnerToast(content as any, options)
  }
  return sonnerToast(message as any, options)
}

// Add methods to the function
export const toast = Object.assign(toastFn, {
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, options)
  },

  error: (message: string, options?: any) => {
    return sonnerToast.error(message, options)
  },

  loading: (message: string, options?: any) => {
    return sonnerToast.loading(message, options)
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: any
  ) => {
    return sonnerToast.promise(promise, msgs as any)
  },

  // Custom toast with icon
  custom: (message: string | React.ReactNode, options?: any) => {
    return sonnerToast(message as any, options)
  },

  // Info toast
  info: (message: string, options?: any) => {
    return sonnerToast.info(message, options)
  },

  // Warning toast
  warning: (message: string, options?: any) => {
    return sonnerToast.warning(message, options)
  },

  // Dismiss toast
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },
})

// Default export for compatibility
export default toast

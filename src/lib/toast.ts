import { toast } from 'sonner';

// Custom toast functions that automatically include close buttons
export const customToast = {
  success: (message: string, options?: any) => {
    return toast.success(message, options);
  },
  
  error: (message: string, options?: any) => {
    return toast.error(message, options);
  },
  
  loading: (message: string, options?: any) => {
    return toast.loading(message, options);
  },
  
  // Generic toast with close button
  custom: (message: string, options?: any) => {
    return toast(message, options);
  },
  
  // Dismiss a specific toast
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
  
  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

// Re-export the original toast for cases where we need it
export { toast }; 
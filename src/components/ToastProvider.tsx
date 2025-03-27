
import React from 'react';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

/**
 * Combined toast provider that includes both shadcn/ui and sonner toast systems
 * This helps ensure that toasts are visible regardless of which system is used
 */
export const ToastProvider = () => {
  return (
    <>
      <ShadcnToaster />
      <SonnerToaster position="bottom-right" />
    </>
  );
};

export default ToastProvider;

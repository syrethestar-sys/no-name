'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useMemo, useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type AuthDialogContextValue = { openAuthDialog: () => void };

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

/** Opens our sign-in popup from anywhere (header, like button, join page). */
export function useAuthDialog(): AuthDialogContextValue {
  const context = useContext(AuthDialogContext);
  if (!context) throw new Error('useAuthDialog must be used inside <AuthDialogProvider>.');
  return context;
}

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const contextValue = useMemo(() => ({ openAuthDialog: () => setIsOpen(true) }), []);

  return (
    <AuthDialogContext.Provider value={contextValue}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm" aria-labelledby="auth-dialog-heading">
          {/* Remounts each time it opens, so a half-finished attempt starts fresh. */}
          {isOpen && (
            <AuthForm
              returnTo={pathname}
              onDone={() => setIsOpen(false)}
              headingId="auth-dialog-heading"
            />
          )}
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}

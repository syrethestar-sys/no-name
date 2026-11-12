'use client';

import { useAuthDialog } from '@/components/auth/auth-dialog-provider';
import { Button } from '@/components/ui/button';

export function SignInButton({
  label = 'Sign in',
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { openAuthDialog } = useAuthDialog();
  return (
    <Button variant="outline" className={className} onClick={openAuthDialog}>
      {label}
    </Button>
  );
}

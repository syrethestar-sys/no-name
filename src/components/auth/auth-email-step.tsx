'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthEmailStep({
  isBusy,
  onSubmit,
}: {
  isBusy: boolean;
  onSubmit: (emailAddress: string) => void;
}) {
  function handleSubmit(formData: FormData) {
    const emailAddress = String(formData.get('email') ?? '').trim();
    if (emailAddress) onSubmit(emailAddress);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>
      <Button type="submit" disabled={isBusy}>
        {isBusy ? 'Sending code…' : 'Continue with email'}
      </Button>
    </form>
  );
}

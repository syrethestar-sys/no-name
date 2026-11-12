'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AccountDetails, DetailField } from '@/hooks/use-auth-flow';

/** Only the fields Clerk still needs for a new account (username and/or password). */
export function AuthDetailsStep({
  fields,
  isBusy,
  onSubmit,
}: {
  fields: DetailField[];
  isBusy: boolean;
  onSubmit: (details: AccountDetails) => void;
}) {
  function handleSubmit(formData: FormData) {
    const details: AccountDetails = {};
    if (fields.includes('username'))
      details.username = String(formData.get('username') ?? '').trim();
    if (fields.includes('password')) details.password = String(formData.get('password') ?? '');
    onSubmit(details);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      {fields.includes('username') && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-username">Username</Label>
          <Input
            id="auth-username"
            name="username"
            autoComplete="username"
            minLength={4}
            maxLength={64}
            required
            autoFocus
          />
        </div>
      )}
      {fields.includes('password') && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus={!fields.includes('username')}
          />
        </div>
      )}
      <Button type="submit" disabled={isBusy}>
        {isBusy ? 'Saving…' : 'Create account'}
      </Button>
    </form>
  );
}

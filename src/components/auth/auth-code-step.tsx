'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthCodeStep({
  emailAddress,
  isBusy,
  onSubmit,
  onResend,
  onChangeEmail,
}: {
  emailAddress: string;
  isBusy: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  function handleSubmit(formData: FormData) {
    const code = String(formData.get('code') ?? '').replace(/\s/g, '');
    if (code) onSubmit(code);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="text-foreground">{emailAddress}</span>.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-code">Code</Label>
        <Input
          id="auth-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          placeholder="123456"
          className="font-mono tracking-[0.3em]"
          required
          autoFocus
        />
      </div>
      <Button type="submit" disabled={isBusy}>
        {isBusy ? 'Checking…' : 'Continue'}
      </Button>
      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-muted-foreground hover:text-foreground"
        >
          Use another email
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={isBusy}
          className="text-primary hover:underline"
        >
          Send a new code
        </button>
      </div>
    </form>
  );
}

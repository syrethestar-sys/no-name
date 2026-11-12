'use client';

import { AuthCodeStep } from '@/components/auth/auth-code-step';
import { AuthDetailsStep } from '@/components/auth/auth-details-step';
import { AuthEmailStep } from '@/components/auth/auth-email-step';
import { GoogleIcon } from '@/components/auth/google-icon';
import { Button } from '@/components/ui/button';
import { type AuthStep, useAuthFlow } from '@/hooks/use-auth-flow';

const HEADINGS: Record<AuthStep, { title: string; description: string }> = {
  email: { title: 'Sign in', description: 'New here? The same form creates your account.' },
  details: { title: 'Create your account', description: 'Just one more step.' },
  code: { title: 'Check your email', description: 'Enter the code to continue.' },
};

/** Our own sign-in / sign-up form. Clerk does the work underneath; no Clerk UI is shown. */
export function AuthForm({
  returnTo,
  onDone,
  resumeSignUp,
  headingId = 'auth-heading',
}: {
  returnTo: string;
  onDone?: () => void;
  resumeSignUp?: boolean;
  headingId?: string;
}) {
  const flow = useAuthFlow({ returnTo, onDone, resumeSignUp });
  const heading = HEADINGS[flow.step];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          {heading.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{heading.description}</p>
      </div>

      {flow.step === 'email' && (
        <>
          <Button variant="outline" disabled={flow.isBusy} onClick={flow.continueWithGoogle}>
            <GoogleIcon />
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <AuthEmailStep isBusy={flow.isBusy} onSubmit={flow.submitEmail} />
        </>
      )}
      {flow.step === 'details' && (
        <AuthDetailsStep
          fields={flow.detailFields}
          isBusy={flow.isBusy}
          onSubmit={flow.submitDetails}
        />
      )}
      {flow.step === 'code' && (
        <AuthCodeStep
          emailAddress={flow.emailAddress}
          isBusy={flow.isBusy}
          onSubmit={flow.submitCode}
          onResend={flow.resendCode}
          onChangeEmail={flow.startOver}
        />
      )}

      {flow.errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {flow.errorMessage}
        </p>
      )}
      {flow.notice && <p className="text-sm text-primary">{flow.notice}</p>}

      {/* Clerk's bot protection renders here on sign-up when it's turned on. */}
      <div id="clerk-captcha" />
    </div>
  );
}

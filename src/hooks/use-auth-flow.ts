'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { authErrorMessage, hasErrorCode } from '@/lib/clerk-errors';

export type AuthStep = 'email' | 'details' | 'code';
export type DetailField = 'username' | 'password';
export type AccountDetails = { username?: string; password?: string };

/** sign-in: existing account. sign-up: new email. continue: finishing a Google sign-up. */
type AuthMode = 'sign-in' | 'sign-up' | 'continue';

type SignInResource = ReturnType<typeof useSignIn>['signIn'];
type Navigate = NonNullable<NonNullable<Parameters<SignInResource['finalize']>[0]>['navigate']>;

const DETAIL_FIELDS = ['username', 'password'] as const satisfies readonly DetailField[];
const missingDetails = (fields: readonly string[]): DetailField[] =>
  DETAIL_FIELDS.filter((field) => fields.includes(field));

/**
 * One flow for both signing in and signing up: the user types an email, and we find out
 * whether the account exists. New accounts are asked only for what Clerk still requires.
 */
export function useAuthFlow(options: {
  returnTo: string;
  onDone?: () => void;
  resumeSignUp?: boolean;
}) {
  const { returnTo, onDone, resumeSignUp = false } = options;
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [step, setStep] = useState<AuthStep>(resumeSignUp ? 'details' : 'email');
  const [mode, setMode] = useState<AuthMode>(resumeSignUp ? 'continue' : 'sign-in');
  const [emailAddress, setEmailAddress] = useState('');
  const [detailFields, setDetailFields] = useState<DetailField[]>(
    resumeSignUp ? missingDetails(signUp.missingFields) : [],
  );
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const navigate: Navigate = ({ decorateUrl }) => {
    const url = decorateUrl(returnTo);
    // decorateUrl can return an absolute URL (Safari tracking protection).
    if (url.startsWith('http')) {
      window.location.href = url;
      return;
    }
    if (onDone) onDone();
    else router.push(url);
    router.refresh();
  };

  /** Runs one step. A returned string is shown as the error message. */
  async function runStep(task: () => Promise<string | null>) {
    setIsBusy(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      setErrorMessage(await task());
    } catch (error) {
      setErrorMessage(authErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function sendSignUpCode(): Promise<string | null> {
    const { error } = await signUp.verifications.sendEmailCode();
    if (error) return authErrorMessage(error);
    setStep('code');
    return null;
  }

  const submitEmail = (email: string) =>
    runStep(async () => {
      setEmailAddress(email);
      const { error } = await signIn.emailCode.sendCode({ emailAddress: email });
      if (!error) {
        setMode('sign-in');
        setStep('code');
        return null;
      }
      if (!hasErrorCode(error, 'form_identifier_not_found')) return authErrorMessage(error);

      // No account yet: start a sign-up and see what else Clerk needs.
      const created = await signUp.create({ emailAddress: email });
      if (created.error) return authErrorMessage(created.error);
      setMode('sign-up');
      const fields = missingDetails(signUp.missingFields);
      if (fields.length === 0) return sendSignUpCode();
      setDetailFields(fields);
      setStep('details');
      return null;
    });

  const submitDetails = (details: AccountDetails) =>
    runStep(async () => {
      if (mode === 'continue') {
        const { error } = await signUp.update({ username: details.username });
        if (error) return authErrorMessage(error);
        if (signUp.status !== 'complete') return 'Could not finish signing up. Try again.';
        await signUp.finalize({ navigate });
        return null;
      }
      const { error } = await signUp.create({ emailAddress, ...details });
      if (error) return authErrorMessage(error);
      return sendSignUpCode();
    });

  const submitCode = (code: string) =>
    runStep(async () => {
      if (mode === 'sign-in') {
        const { error } = await signIn.emailCode.verifyCode({ code });
        if (error) return authErrorMessage(error);
        if (signIn.status !== 'complete') {
          return 'This account needs another sign-in step. Try Continue with Google.';
        }
        await signIn.finalize({ navigate });
        return null;
      }
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) return authErrorMessage(error);
      if (signUp.status !== 'complete') return 'Could not finish signing up. Try again.';
      await signUp.finalize({ navigate });
      return null;
    });

  const resendCode = () =>
    runStep(async () => {
      const { error } =
        mode === 'sign-in'
          ? await signIn.emailCode.sendCode()
          : await signUp.verifications.sendEmailCode();
      if (error) return authErrorMessage(error);
      setNotice('A new code is on its way.');
      return null;
    });

  const continueWithGoogle = () =>
    runStep(async () => {
      const { error } = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: returnTo,
        redirectCallbackUrl: '/sso-callback',
      });
      return error ? authErrorMessage(error) : null;
    });

  function startOver() {
    setStep('email');
    setMode('sign-in');
    setErrorMessage(null);
    setNotice(null);
  }

  return {
    step,
    emailAddress,
    detailFields,
    isBusy,
    errorMessage,
    notice,
    submitEmail,
    submitDetails,
    submitCode,
    resendCode,
    continueWithGoogle,
    startOver,
  };
}

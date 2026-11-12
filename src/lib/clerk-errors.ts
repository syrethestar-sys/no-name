/** Helpers for errors returned by Clerk's sign-in / sign-up hooks. Client-safe: no keys here. */

type ClerkApiErrorItem = { code: string; message: string; longMessage?: string };

function apiErrors(error: unknown): ClerkApiErrorItem[] {
  if (typeof error !== 'object' || error === null || !('errors' in error)) return [];
  return Array.isArray(error.errors) ? (error.errors as ClerkApiErrorItem[]) : [];
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return apiErrors(error).some((item) => item.code === code);
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  form_code_incorrect: 'That code is wrong. Check your email and try again.',
  verification_expired: 'That code has expired. Send a new one.',
  verification_failed: 'Too many tries. Send a new code.',
  form_identifier_exists: 'That username is taken. Try another one.',
  form_username_invalid_character: 'Usernames can use letters, numbers, "-" and "_".',
  form_password_pwned: 'This password was found in a data leak. Choose a different one.',
};

/** A short message to show the user. Clerk's own messages are written for end users. */
export function authErrorMessage(error: unknown): string {
  const [first] = apiErrors(error);
  if (!first) return 'Something went wrong. Try again.';
  return FRIENDLY_MESSAGES[first.code] ?? first.longMessage ?? first.message;
}

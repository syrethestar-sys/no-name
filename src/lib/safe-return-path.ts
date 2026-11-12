/**
 * Keep only the path + query of redirect_url (Clerk may send a full URL), so the page can never
 * send people to another site.
 */
export function safeReturnPath(value: string | undefined): string {
  if (!value) return '/';
  try {
    const { pathname, search } = new URL(value, 'http://placeholder.invalid');
    const isSameSitePath = pathname.startsWith('/') && !pathname.startsWith('//');
    return isSameSitePath ? `${pathname}${search}` : '/';
  } catch {
    return '/';
  }
}

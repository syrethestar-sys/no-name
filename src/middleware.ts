import { clerkMiddleware } from '@clerk/nextjs/server';

// Only attaches the Clerk session. Guests can browse; each owner-only page and
// API route checks access itself with getAdminUserId() from '@/lib/auth'.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm)).*)',
    '/(api|trpc)(.*)',
  ],
};

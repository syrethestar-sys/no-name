import Link from 'next/link';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import { isAdmin } from '@/lib/auth';

export async function SiteHeader() {
  const isOwner = await isAdmin();

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Experience<span className="text-accent">.</span>
        </Link>
        <Link href="/search" className="text-sm text-muted hover:text-foreground">
          Search
        </Link>
        {isOwner && (
          <Link href="/upload" className="text-sm text-muted hover:text-foreground">
            Upload
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-card border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-raised">
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            {isOwner && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent">
                owner
              </span>
            )}
            <UserButton />
          </Show>
        </div>
      </nav>
    </header>
  );
}

import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { Show } from '@clerk/nextjs';
import { AccountMenu } from '@/components/auth/account-menu';
import { SignInButton } from '@/components/auth/sign-in-button';
import { getViewer, type Viewer } from '@/lib/auth';
import { countPendingRequests } from '@/lib/members';

const navLinkClass = 'text-sm text-muted-foreground hover:text-foreground';

async function loadHeaderState(): Promise<{ viewer: Viewer | null; pendingCount: number }> {
  try {
    const viewer = await getViewer();
    const pendingCount = viewer.isOwner ? await countPendingRequests() : 0;
    return { viewer, pendingCount };
  } catch (error) {
    unstable_rethrow(error); // let Next's own signals (dynamic rendering, redirects) through
    // A DB hiccup must not take down every page: render the header without member info.
    console.error('header state failed', error);
    return { viewer: null, pendingCount: 0 };
  }
}

export async function SiteHeader() {
  const { viewer, pendingCount } = await loadHeaderState();
  const isOwner = viewer?.isOwner ?? false;
  const showJoin = viewer !== null && !viewer.isMember && viewer.memberStatus !== 'pending';

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-12 max-w-7xl items-center gap-5 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Experience<span className="text-primary">.</span>
        </Link>
        <Link href="/search" className={navLinkClass}>
          Search
        </Link>
        {isOwner && (
          <>
            <Link href="/upload" className={navLinkClass}>
              Upload
            </Link>
            <Link href="/admin/members" className={navLinkClass}>
              Members
              {pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </Link>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          {showJoin && (
            <Link href="/join" className="text-sm text-primary hover:underline">
              Join
            </Link>
          )}
          {viewer?.memberStatus === 'pending' && !viewer.isMember && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              request pending
            </span>
          )}
          <Show when="signed-out">
            <SignInButton />
          </Show>
          <Show when="signed-in">
            {isOwner && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs text-primary">
                owner
              </span>
            )}
            <AccountMenu />
          </Show>
        </div>
      </nav>
    </header>
  );
}

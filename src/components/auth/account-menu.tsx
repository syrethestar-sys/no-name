'use client';

import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { LogOutIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Our replacement for Clerk's UserButton: avatar, who you are, sign out. */
export function AccountMenu() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  if (!user) return null;

  const displayName = user.fullName || user.username || 'Account';
  const emailAddress = user.primaryEmailAddress?.emailAddress ?? '';

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar>
          <AvatarImage src={user.imageUrl} alt="" />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="truncate font-medium text-foreground">{displayName}</div>
            {emailAddress && (
              <div className="truncate text-xs font-normal text-muted-foreground">
                {emailAddress}
              </div>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOutIcon aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

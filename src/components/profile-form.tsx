'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5_000_000;

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;

/** Change your name and photo. Clerk keeps them; we only draw the form. */
export function ProfileForm() {
  const { isLoaded, user } = useUser();
  if (!isLoaded || !user) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return <ProfileFields user={user} />;
}

function ProfileFields({ user }: { user: ClerkUser }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const displayName = user.fullName || user.username || 'Account';

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    if (isSavingName || !firstName.trim()) return;
    setIsSavingName(true);
    setErrorMessage(null);
    setSavedMessage(null);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setSavedMessage('Saved.');
      router.refresh(); // names on comments are read on the server
    } catch {
      setErrorMessage('Could not save. Try again.');
    } finally {
      setIsSavingName(false);
    }
  }

  async function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = ''; // so picking the same file again still fires
    if (!file) return;
    setErrorMessage(null);
    setSavedMessage(null);
    if (!PHOTO_TYPES.includes(file.type)) return setErrorMessage('Use a jpg, png or webp picture.');
    if (file.size > MAX_PHOTO_BYTES) return setErrorMessage('That picture is over 5 MB.');

    setIsSavingPhoto(true);
    try {
      await user.setProfileImage({ file });
      setSavedMessage('Photo changed.');
      router.refresh();
    } catch {
      setErrorMessage('Could not change the photo. Try again.');
    } finally {
      setIsSavingPhoto(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={user.imageUrl} alt="" />
          <AvatarFallback className="text-xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="profile-photo"
            className="cursor-pointer text-sm font-medium text-primary hover:underline"
          >
            {isSavingPhoto ? 'Uploading…' : 'Change photo'}
          </Label>
          <input
            id="profile-photo"
            type="file"
            accept={PHOTO_TYPES.join(',')}
            disabled={isSavingPhoto}
            onChange={choosePhoto}
            className="sr-only"
          />
          <p className="text-xs text-muted-foreground">jpg, png or webp, up to 5 MB.</p>
        </div>
      </div>

      <form onSubmit={saveName} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-first-name">First name</Label>
            <Input
              id="profile-first-name"
              value={firstName}
              maxLength={50}
              required
              disabled={isSavingName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-last-name">Last name</Label>
            <Input
              id="profile-last-name"
              value={lastName}
              maxLength={50}
              disabled={isSavingName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This is the name shown next to your comments.
        </p>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        {savedMessage && <p className="text-sm text-primary">{savedMessage}</p>}
        <Button type="submit" className="self-start" disabled={isSavingName || !firstName.trim()}>
          {isSavingName ? 'Saving…' : 'Save name'}
        </Button>
      </form>
    </div>
  );
}

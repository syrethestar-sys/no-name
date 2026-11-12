'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { MemberInterest } from '@/types/db';

const INTEREST_OPTIONS: { value: MemberInterest; label: string }[] = [
  { value: 'trading', label: 'Trading' },
  { value: 'coding', label: 'Coding' },
  { value: 'sharing', label: 'Sharing work & life experience' },
  { value: 'other', label: 'Something else' },
];
const MIN_INTRO = 20;

export function JoinForm() {
  const router = useRouter();
  const [intro, setIntro] = useState('');
  const [interests, setInterests] = useState<MemberInterest[]>([]);
  const [link, setLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const introLength = intro.trim().length;

  function toggleInterest(interest: MemberInterest) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function sendRequest(event: React.FormEvent) {
    event.preventDefault();
    if (isSending || introLength < MIN_INTRO) return;
    setIsSending(true);
    setErrorMessage(null);

    const response = await fetch('/api/members/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intro, interests, link: link.trim() || null }),
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      setErrorMessage(data?.error ?? 'Could not send your request. Try again.');
      setIsSending(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={sendRequest} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="join-intro">Who are you, and why do you want to join?</Label>
        <Textarea
          id="join-intro"
          value={intro}
          rows={5}
          maxLength={1000}
          required
          disabled={isSending}
          placeholder="A few sentences: what you do, what you'd like to learn or share."
          onChange={(event) => setIntro(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {introLength < MIN_INTRO ? `At least ${MIN_INTRO - introLength} more characters` : '✓'}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Interests (optional)</legend>
        {INTEREST_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={interests.includes(option.value)}
              disabled={isSending}
              onChange={() => toggleInterest(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="join-link">Link (optional): GitHub, portfolio, trading journal…</Label>
        <Input
          id="join-link"
          type="url"
          value={link}
          maxLength={300}
          disabled={isSending}
          placeholder="https://"
          onChange={(event) => setLink(event.target.value)}
        />
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button type="submit" size="lg" disabled={isSending || introLength < MIN_INTRO}>
        {isSending ? 'Sending…' : 'Send request'}
      </Button>
    </form>
  );
}

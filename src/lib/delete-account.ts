/** The three things deleting an account does, so tests can swap in fakes. */
export type DeleteAccountSteps = {
  isOwner: (userId: string) => Promise<boolean>;
  /** Our own rows: likes, ratings, comments (and the replies under them), membership. */
  deleteData: (userId: string) => Promise<void>;
  /** The sign-in itself (the Clerk user). */
  deleteLogin: (userId: string) => Promise<void>;
};

export type DeleteAccountResult = 'deleted' | 'owner';

/**
 * Deletes a person's data, then their sign-in. In that order on purpose: if the second step
 * fails the person is still signed in and can simply try again, and nothing half-deleted is left
 * behind. The owner account is never deleted, so the site cannot lose its admin by a mis-click.
 */
export async function deleteAccount(
  userId: string,
  steps: DeleteAccountSteps,
): Promise<DeleteAccountResult> {
  if (await steps.isOwner(userId)) return 'owner';
  await steps.deleteData(userId);
  await steps.deleteLogin(userId);
  return 'deleted';
}

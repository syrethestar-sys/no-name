import { describe, expect, it } from 'vitest';
import { deleteAccount, type DeleteAccountSteps } from '@/lib/delete-account';

function fakeSteps(options: { isOwner?: boolean; failLogin?: boolean } = {}) {
  const calls: string[] = [];
  const steps: DeleteAccountSteps = {
    isOwner: async () => options.isOwner ?? false,
    deleteData: async (userId) => {
      calls.push(`data:${userId}`);
    },
    deleteLogin: async (userId) => {
      calls.push(`login:${userId}`);
      if (options.failLogin) throw new Error('clerk is down');
    },
  };
  return { steps, calls };
}

describe('deleteAccount', () => {
  it('deletes the data first and the sign-in second', async () => {
    const { steps, calls } = fakeSteps();
    expect(await deleteAccount('user_1', steps)).toBe('deleted');
    expect(calls).toEqual(['data:user_1', 'login:user_1']);
  });

  it('never touches the owner account', async () => {
    const { steps, calls } = fakeSteps({ isOwner: true });
    expect(await deleteAccount('owner_1', steps)).toBe('owner');
    expect(calls).toEqual([]);
  });

  it('fails loudly when the sign-in cannot be deleted, after the data is gone (so a retry works)', async () => {
    const { steps, calls } = fakeSteps({ failLogin: true });
    await expect(deleteAccount('user_1', steps)).rejects.toThrow('clerk is down');
    expect(calls).toEqual(['data:user_1', 'login:user_1']);
  });
});

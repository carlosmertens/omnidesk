import { describe, expect, it } from 'vitest';
import { comparePassword, hashPassword } from './password.util.js';

describe('password.util', () => {
  it('hashes a password into a non-plaintext bcrypt digest', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');

    expect(hash).not.toBe('correct-horse-battery-staple');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('matches the correct password against its hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');

    await expect(comparePassword('correct-horse-battery-staple', hash)).resolves.toBe(
      true,
    );
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');

    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});

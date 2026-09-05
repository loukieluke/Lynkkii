import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
import { ADMIN_PASSWORD } from './env';

// Lightweight shared-password gate for the v1 admin (brief: solo build, managed
// simplicity). Real per-user roles arrive with the Phase 4 partner portal.

const COOKIE = 'lynkkii_admin';

function token(): string {
  return createHash('sha256').update(`lynkkii:${ADMIN_PASSWORD}`).digest('hex');
}

export function adminConfigured(): boolean {
  return Boolean(ADMIN_PASSWORD);
}

export function checkPassword(input: string): boolean {
  return adminConfigured() && input === ADMIN_PASSWORD;
}

export async function isAuthed(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === token();
}

export async function signIn(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

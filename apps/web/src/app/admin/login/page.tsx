import { redirect } from 'next/navigation';
import { adminConfigured, isAuthed } from '@/lib/auth';
import { loginAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect('/admin');
  const { error } = await searchParams;

  return (
    <div className="container">
      <form className="form form--narrow" action={loginAction}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Admin sign in</h1>
        <p className="field__hint" style={{ marginTop: -8 }}>
          Curation tool for the IrieEvents catalog.
        </p>
        {!adminConfigured() ? (
          <div className="alert alert--error">
            Set <code>ADMIN_PASSWORD</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in{' '}
            <code>apps/web/.env.local</code>.
          </div>
        ) : null}
        {error ? <div className="alert alert--error">{error}</div> : null}
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="btn btn--primary" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}

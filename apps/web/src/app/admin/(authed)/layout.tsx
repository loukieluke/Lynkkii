import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/auth';
import { logoutAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AuthedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) redirect('/admin/login');

  return (
    <div className="admin">
      <div className="container">
        <div className="admin__head">
          <nav className="nav" style={{ gap: 4 }}>
            <Link href="/admin">Events</Link>
            <Link href="/admin/venues">Venues</Link>
            <Link href="/admin/events/new" className="btn btn--primary" style={{ padding: '8px 14px' }}>
              + New event
            </Link>
          </nav>
          <form action={logoutAction}>
            <button className="chip" type="submit">
              Sign out
            </button>
          </form>
        </div>
        {children}
      </div>
    </div>
  );
}

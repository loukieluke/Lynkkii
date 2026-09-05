import Link from 'next/link';
import { formatEventDateTime } from '@lynkkii/api';
import { getServiceClient } from '@/lib/supabase';
import { deleteEventAction, togglePublishAction } from '../actions';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  title: string;
  slug: string | null;
  start_time: string;
  parish: string | null;
  flyer_url: string | null;
  is_published: boolean;
  venue: { name: string } | null;
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const client = getServiceClient();

  let rows: Row[] = [];
  let loadError: string | null = null;
  if (!client) {
    loadError = 'SUPABASE_SERVICE_ROLE_KEY is not configured.';
  } else {
    const { data, error: e } = await client
      .from('events')
      .select('id, title, slug, start_time, parish, flyer_url, is_published, venue:venues(name)')
      .order('start_time', { ascending: true });
    if (e) loadError = e.message;
    else rows = (data ?? []) as unknown as Row[];
  }

  return (
    <>
      <div className="admin__head">
        <h1>Events ({rows.length})</h1>
      </div>
      {ok ? <div className="alert alert--ok">{ok}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}
      {loadError ? (
        <div className="notice">
          <h3>Couldn’t load events</h3>
          <p>{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="notice">
          <h3>No events yet</h3>
          <p>
            <Link href="/admin/events/new">Create your first event →</Link>
          </p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>When</th>
              <th>Parish</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.flyer_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={r.flyer_url} alt="" />
                  ) : (
                    <div className="thumb" />
                  )}
                </td>
                <td>
                  <strong>{r.title}</strong>
                  <br />
                  <span className="field__hint">{r.venue?.name ?? '—'}</span>
                </td>
                <td>{formatEventDateTime(r.start_time)}</td>
                <td>{r.parish ?? '—'}</td>
                <td>
                  <span className={`pill ${r.is_published ? 'pill--live' : 'pill--draft'}`}>
                    {r.is_published ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Link href={`/admin/events/${r.id}`} className="chip">
                      Edit
                    </Link>
                    <form action={togglePublishAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="next" value={String(!r.is_published)} />
                      <button className="chip" type="submit">
                        {r.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </form>
                    <form action={deleteEventAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="chip chip--ghost" type="submit" data-active>
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

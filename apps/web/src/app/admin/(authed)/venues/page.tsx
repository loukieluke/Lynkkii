import { PARISHES } from '@irie/types';
import { getServiceClient } from '@/lib/supabase';
import { saveVenueAction } from '../../actions';

export const dynamic = 'force-dynamic';

type VenueRow = { id: string; name: string; parish: string | null; neighborhood: string | null };

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const client = getServiceClient();
  let venues: VenueRow[] = [];
  if (client) {
    const { data } = await client.from('venues').select('id, name, parish, neighborhood').order('name');
    venues = (data ?? []) as VenueRow[];
  }

  return (
    <>
      <h1 style={{ fontSize: 22, margin: '0 0 16px' }}>Venues</h1>
      {ok ? <div className="alert alert--ok">{ok}</div> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <form className="form" action={saveVenueAction}>
          <h3 style={{ margin: 0 }}>Add a venue</h3>
          <div className="field">
            <label htmlFor="name">Name *</label>
            <input id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" />
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="neighborhood">Neighborhood</label>
              <input id="neighborhood" name="neighborhood" />
            </div>
            <div className="field">
              <label htmlFor="parish">Parish</label>
              <select id="parish" name="parish" defaultValue="">
                <option value="">—</option>
                {PARISHES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="lat">Latitude</label>
              <input id="lat" name="lat" type="number" step="any" placeholder="17.9899" />
            </div>
            <div className="field">
              <label htmlFor="lng">Longitude</label>
              <input id="lng" name="lng" type="number" step="any" placeholder="-76.7834" />
            </div>
          </div>
          <span className="field__hint">Lat/lng powers “near me” + the map. Grab them from Google Maps.</span>
          <div className="form__actions">
            <button className="btn btn--primary" type="submit">
              Save venue
            </button>
          </div>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Parish</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong>{v.name}</strong>
                  {v.neighborhood ? <br /> : null}
                  {v.neighborhood ? <span className="field__hint">{v.neighborhood}</span> : null}
                </td>
                <td>{v.parish ?? '—'}</td>
              </tr>
            ))}
            {venues.length === 0 ? (
              <tr>
                <td colSpan={2} className="field__hint">
                  No venues yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

import { searchEvents } from '@lynkkii/api';
import type { FeedEvent } from '@lynkkii/types';
import { MapView } from '@/components/MapView';
import { getReadClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const client = getReadClient();
  let events: FeedEvent[] = [];
  if (client) {
    try {
      events = await searchEvents(client, { limit: 200 });
    } catch {
      events = [];
    }
  }
  const withGeo = events.filter((e) => e.venue?.lat != null && e.venue?.lng != null);

  return (
    <section className="detail">
      <div className="container">
        <h1 style={{ fontSize: 28, letterSpacing: '-0.02em', margin: '8px 0 16px' }}>
          Events map
        </h1>
        {client ? (
          <MapView events={withGeo} />
        ) : (
          <div className="notice">
            <h3>Connect Supabase to see the map</h3>
            <p>Configure your Supabase env vars, then reload.</p>
          </div>
        )}
      </div>
    </section>
  );
}

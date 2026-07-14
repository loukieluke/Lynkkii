import { notFound } from 'next/navigation';
import { EventForm, type EventEditData, type VenueOption } from '@/components/admin/EventForm';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const client = getServiceClient();
  if (!client) notFound();

  const [{ data: event }, { data: venueRows }] = await Promise.all([
    client
      .from('events')
      .select(
        'id, title, short_description, description, start_time, end_time, venue_id, event_type, price_type, price_display, price_min, price_max, currency, flyer_url, ticket_url, organizer, source_url, source_type, is_published',
      )
      .eq('id', id)
      .maybeSingle(),
    client.from('venues').select('id, name, parish').order('name'),
  ]);

  if (!event) notFound();

  return (
    <>
      <h1 style={{ fontSize: 22, margin: '0 0 16px' }}>Edit event</h1>
      <EventForm
        event={event as unknown as EventEditData}
        venues={(venueRows ?? []) as VenueOption[]}
        error={error}
      />
    </>
  );
}

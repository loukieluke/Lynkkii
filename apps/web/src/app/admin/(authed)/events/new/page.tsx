import { EventForm, type VenueOption } from '@/components/admin/EventForm';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const client = getServiceClient();
  let venues: VenueOption[] = [];
  if (client) {
    const { data } = await client.from('venues').select('id, name, parish').order('name');
    venues = (data ?? []) as VenueOption[];
  }
  return (
    <>
      <h1 style={{ fontSize: 22, margin: '0 0 16px' }}>New event</h1>
      <EventForm venues={venues} error={error} />
    </>
  );
}

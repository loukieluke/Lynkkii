import type { FeedEvent } from '@irie/types';
import type { IrieClient } from './client';

/** IDs of the current user's favorited events. Requires an authenticated session. */
export async function listFavoriteIds(client: IrieClient): Promise<string[]> {
  const { data, error } = await client.from('favorites').select('event_id');
  if (error) throw new Error(`listFavoriteIds failed: ${error.message}`);
  return (data ?? []).map((r) => r.event_id);
}

/** Full favorited events (joined). Requires an authenticated session. */
export async function listFavoriteEvents(client: IrieClient): Promise<FeedEvent[]> {
  const { data, error } = await client
    .from('favorites')
    .select(
      `event:events (
        id, title, slug, short_description, description, start_time, end_time, timezone,
        parish, event_type, status, price_display, price_min, price_max, currency, price_type,
        flyer_url, ticket_url, organizer, source_url, source_type, source_urls, confidence, last_updated,
        venue:venues ( name, address, neighborhood, parish, geo )
      )`,
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listFavoriteEvents failed: ${error.message}`);
  return (data ?? [])
    .map((r) => (r as { event: FeedEvent | null }).event)
    .filter((e): e is FeedEvent => e !== null);
}

export async function addFavorite(client: IrieClient, eventId: string): Promise<void> {
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Must be signed in to save events');
  const { error } = await client
    .from('favorites')
    .upsert({ user_id: userId, event_id: eventId }, { onConflict: 'user_id,event_id' });
  if (error) throw new Error(`addFavorite failed: ${error.message}`);
}

export async function removeFavorite(client: IrieClient, eventId: string): Promise<void> {
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Must be signed in to manage saved events');
  const { error } = await client
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);
  if (error) throw new Error(`removeFavorite failed: ${error.message}`);
}

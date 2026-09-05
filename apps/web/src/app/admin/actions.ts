'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { EventType, Parish, PriceType, SourceType } from '@lynkkii/types';
import { getServiceClient } from '@/lib/supabase';
import { checkPassword, signIn, signOut, isAuthed } from '@/lib/auth';

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
}
function numOrNull(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// datetime-local inputs are timezone-naive. Jamaica has no DST, so we can safely
// pin the fixed -05:00 offset to interpret admin input as America/Jamaica time.
function jamaicaIso(local: string | null): string | null {
  if (!local) return null;
  const hasTz = /([zZ]|[+-]\d\d:?\d\d)$/.test(local);
  const iso = hasTz ? local : `${local}-05:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function requireAuth() {
  if (!(await isAuthed())) redirect('/admin/login');
}

export async function loginAction(formData: FormData) {
  const password = str(formData, 'password') ?? '';
  if (!checkPassword(password)) redirect('/admin/login?error=Invalid%20password');
  await signIn();
  redirect('/admin');
}

export async function logoutAction() {
  await signOut();
  redirect('/admin/login');
}

async function uploadFlyer(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const client = getServiceClient();
  if (!client) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from('flyers').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(`Flyer upload failed: ${error.message}`);
  const { data } = client.storage.from('flyers').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveVenueAction(formData: FormData) {
  await requireAuth();
  const client = getServiceClient();
  if (!client) redirect('/admin/venues?error=Service%20role%20not%20configured');

  const name = str(formData, 'name');
  if (!name) redirect('/admin/venues?error=Name%20required');

  const lat = numOrNull(formData, 'lat');
  const lng = numOrNull(formData, 'lng');

  const { error } = await client.from('venues').insert({
    name: name!,
    address: str(formData, 'address'),
    neighborhood: str(formData, 'neighborhood'),
    parish: (str(formData, 'parish') as Parish | null) ?? undefined,
    geo:
      lat != null && lng != null
        ? (`SRID=4326;POINT(${lng} ${lat})` as unknown as never)
        : undefined,
  });
  if (error) redirect(`/admin/venues?error=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/venues');
  redirect('/admin/venues?ok=Venue%20saved');
}

export async function saveEventAction(formData: FormData) {
  await requireAuth();
  const client = getServiceClient();
  if (!client) redirect('/admin/events/new?error=Service%20role%20not%20configured');

  const id = str(formData, 'id');
  const title = str(formData, 'title');
  const start = str(formData, 'start_time');
  const backTo = id ? `/admin/events/${id}` : '/admin/events/new';

  if (!title || !start) redirect(`${backTo}?error=Title%20and%20start%20time%20are%20required`);

  let flyerUrl = str(formData, 'flyer_url');
  try {
    const file = formData.get('flyer_file');
    if (file instanceof File) {
      const uploaded = await uploadFlyer(file);
      if (uploaded) flyerUrl = uploaded;
    }
  } catch (e) {
    redirect(`${backTo}?error=${encodeURIComponent(e instanceof Error ? e.message : 'upload failed')}`);
  }

  const priceType = (str(formData, 'price_type') as PriceType) ?? 'paid';

  const payload = {
    title: title!,
    short_description: str(formData, 'short_description'),
    description: str(formData, 'description'),
    start_time: jamaicaIso(start)!,
    end_time: jamaicaIso(str(formData, 'end_time')),
    venue_id: str(formData, 'venue_id'),
    event_type: (str(formData, 'event_type') as EventType) ?? 'other',
    price_type: priceType,
    price_display: str(formData, 'price_display'),
    price_min: numOrNull(formData, 'price_min'),
    price_max: numOrNull(formData, 'price_max'),
    currency: str(formData, 'currency') ?? 'JMD',
    flyer_url: flyerUrl,
    ticket_url: str(formData, 'ticket_url'),
    organizer: str(formData, 'organizer'),
    source_url: str(formData, 'source_url'),
    source_type: (str(formData, 'source_type') as SourceType) ?? 'manual',
    is_published: formData.get('is_published') === 'on',
  };

  if (id) {
    const { error } = await client.from('events').update(payload).eq('id', id);
    if (error) redirect(`${backTo}?error=${encodeURIComponent(error.message)}`);
  } else {
    const { error } = await client.from('events').insert(payload);
    if (error) redirect(`${backTo}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath('/admin');
  redirect('/admin?ok=Event%20saved');
}

export async function togglePublishAction(formData: FormData) {
  await requireAuth();
  const client = getServiceClient();
  if (!client) redirect('/admin?error=Service%20role%20not%20configured');
  const id = str(formData, 'id');
  const next = formData.get('next') === 'true';
  if (id) {
    const { error } = await client.from('events').update({ is_published: next }).eq('id', id);
    if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath('/admin');
  redirect('/admin');
}

export async function deleteEventAction(formData: FormData) {
  await requireAuth();
  const client = getServiceClient();
  if (!client) redirect('/admin?error=Service%20role%20not%20configured');
  const id = str(formData, 'id');
  if (id) {
    const { error } = await client.from('events').delete().eq('id', id);
    if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath('/admin');
  redirect('/admin?ok=Event%20deleted');
}

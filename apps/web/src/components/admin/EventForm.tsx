import { EVENT_TYPES, EVENT_TYPE_LABELS, SOURCE_TYPES, JAMAICA_TZ } from '@irie/types';
import { saveEventAction } from '@/app/admin/actions';

export type EventEditData = {
  id?: string;
  title?: string | null;
  short_description?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue_id?: string | null;
  event_type?: string | null;
  price_type?: string | null;
  price_display?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  currency?: string | null;
  flyer_url?: string | null;
  ticket_url?: string | null;
  organizer?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  is_published?: boolean;
};

export type VenueOption = { id: string; name: string; parish: string | null };

// ISO -> "YYYY-MM-DDTHH:mm" rendered in Jamaica time for datetime-local inputs.
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAMAICA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;
}

export function EventForm({
  event,
  venues,
  error,
}: {
  event?: EventEditData;
  venues: VenueOption[];
  error?: string;
}) {
  const e = event ?? {};
  return (
    <form className="form" action={saveEventAction} encType="multipart/form-data">
      {error ? <div className="alert alert--error">{error}</div> : null}
      {e.id ? <input type="hidden" name="id" value={e.id} /> : null}

      <div className="field">
        <label htmlFor="title">Title *</label>
        <input id="title" name="title" defaultValue={e.title ?? ''} required />
      </div>

      <div className="field">
        <label htmlFor="short_description">Short description (≤200 chars)</label>
        <input id="short_description" name="short_description" maxLength={200} defaultValue={e.short_description ?? ''} />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={e.description ?? ''} />
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="start_time">Start (Jamaica time) *</label>
          <input id="start_time" name="start_time" type="datetime-local" defaultValue={toLocalInput(e.start_time)} required />
        </div>
        <div className="field">
          <label htmlFor="end_time">End (Jamaica time)</label>
          <input id="end_time" name="end_time" type="datetime-local" defaultValue={toLocalInput(e.end_time)} />
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="venue_id">Venue</label>
          <select id="venue_id" name="venue_id" defaultValue={e.venue_id ?? ''}>
            <option value="">— none —</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.parish ? ` (${v.parish})` : ''}
              </option>
            ))}
          </select>
          <span className="field__hint">Parish + geo come from the venue automatically.</span>
        </div>
        <div className="field">
          <label htmlFor="event_type">Type</label>
          <select id="event_type" name="event_type" defaultValue={e.event_type ?? 'other'}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="price_type">Price type</label>
          <select id="price_type" name="price_type" defaultValue={e.price_type ?? 'paid'}>
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="price_display">Price display</label>
          <input id="price_display" name="price_display" placeholder="JMD 2,000 / USD 15" defaultValue={e.price_display ?? ''} />
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="price_min">Price min</label>
          <input id="price_min" name="price_min" type="number" step="0.01" defaultValue={e.price_min ?? ''} />
        </div>
        <div className="field">
          <label htmlFor="price_max">Price max</label>
          <input id="price_max" name="price_max" type="number" step="0.01" defaultValue={e.price_max ?? ''} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="flyer_file">Flyer image</label>
        {e.flyer_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.flyer_url} alt="current flyer" style={{ width: 140, borderRadius: 10, marginBottom: 6 }} />
        ) : null}
        <input id="flyer_file" name="flyer_file" type="file" accept="image/*" />
        <span className="field__hint">Uploads to Supabase Storage. Or paste a URL below.</span>
        <input name="flyer_url" placeholder="https://…/flyer.jpg" defaultValue={e.flyer_url ?? ''} />
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="ticket_url">Ticket URL</label>
          <input id="ticket_url" name="ticket_url" type="url" defaultValue={e.ticket_url ?? ''} />
        </div>
        <div className="field">
          <label htmlFor="organizer">Organizer</label>
          <input id="organizer" name="organizer" defaultValue={e.organizer ?? ''} />
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="source_url">Source URL</label>
          <input id="source_url" name="source_url" type="url" defaultValue={e.source_url ?? ''} />
        </div>
        <div className="field">
          <label htmlFor="source_type">Source type</label>
          <select id="source_type" name="source_type" defaultValue={e.source_type ?? 'manual'}>
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" name="is_published" defaultChecked={e.is_published ?? true} style={{ width: 18, height: 18 }} />
        <span style={{ fontWeight: 700 }}>Published (visible in the app &amp; site)</span>
      </label>

      <div className="form__actions">
        <button className="btn btn--primary" type="submit">
          {e.id ? 'Save changes' : 'Create event'}
        </button>
      </div>
    </form>
  );
}

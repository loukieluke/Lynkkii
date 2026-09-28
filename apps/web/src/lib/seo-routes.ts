import { PARISHES, EVENT_TYPES, EVENT_TYPE_LABELS, type Parish, type EventType } from '@lynkkii/types';

export function parishToSlug(parish: Parish): string {
  return parish.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-');
}

export function slugToParish(slug: string): Parish | undefined {
  return PARISHES.find((p) => parishToSlug(p) === slug);
}

export function categoryToSlug(type: EventType): string {
  return type;
}

export function slugToCategory(slug: string): EventType | undefined {
  return EVENT_TYPES.find((t) => t === slug);
}

export const PARISH_LINKS = PARISHES.map((p) => ({ parish: p, slug: parishToSlug(p) }));
export const CATEGORY_LINKS = EVENT_TYPES.filter((t) => t !== 'other').map((t) => ({
  type: t,
  slug: categoryToSlug(t),
  label: EVENT_TYPE_LABELS[t],
}));

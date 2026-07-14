import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { formatEventDateTime, priceBadge } from '@irie/api';
import { EVENT_TYPE_LABELS, type FeedEvent } from '@irie/types';
import { colors, radius, spacing } from '@/lib/theme';

export function EventCard({ event }: { event: FeedEvent }) {
  const isFree = event.price_type === 'free';
  const location = [event.venue?.name, event.parish].filter(Boolean).join(' · ');

  return (
    <Link href={`/event/${event.slug ?? event.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.media}>
          {event.flyer_url ? (
            <Image source={{ uri: event.flyer_url }} style={styles.image} contentFit="cover" transition={200} />
          ) : null}
          <View style={styles.badges}>
            <View style={[styles.badge, isFree && styles.badgeFree]}>
              <Text style={styles.badgeText}>{priceBadge(event)}</Text>
            </View>
            <View style={[styles.badge, styles.badgeType]}>
              <Text style={[styles.badgeText, styles.badgeTypeText]}>
                {EVENT_TYPE_LABELS[event.event_type]}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.date}>{formatEventDateTime(event.start_time)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          {location ? (
            <Text style={styles.meta} numberOfLines={1}>
              📍 {location}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  media: { aspectRatio: 4 / 3, backgroundColor: '#DFEAE2' },
  image: { width: '100%', height: '100%' },
  badges: { position: 'absolute', left: 12, top: 12, flexDirection: 'row', gap: 6 },
  badge: {
    backgroundColor: 'rgba(14,21,18,0.72)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeFree: { backgroundColor: colors.green },
  badgeType: { backgroundColor: 'rgba(255,255,255,0.92)' },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  badgeTypeText: { color: colors.ink },
  body: { padding: spacing.lg, gap: 4 },
  date: { color: colors.greenDark, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  title: { color: colors.ink, fontWeight: '700', fontSize: 17, lineHeight: 22 },
  meta: { color: colors.muted, fontSize: 14, marginTop: 2 },
});

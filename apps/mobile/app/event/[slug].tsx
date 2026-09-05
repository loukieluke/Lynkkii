import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getEventBySlug, formatEventDate, formatEventTime, priceBadge, eventWebUrl } from '@lynkkii/api';
import { EVENT_TYPE_LABELS, type FeedEvent } from '@lynkkii/types';
import { EventMap } from '@/components/EventMap';
import { isConfigured, supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useFavorites } from '@/lib/favorites';
import { colors, radius, spacing } from '@/lib/theme';

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://lynkkii.app';

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !slug) {
      setLoading(false);
      return;
    }
    getEventBySlug(supabase, slug)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Event not found.</Text>
      </View>
    );
  }

  const v = event.venue;
  const hasGeo = v?.lat != null && v?.lng != null;
  const fav = isFavorite(event.id);

  async function onToggleFavorite() {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    try {
      await toggle(event!.id);
    } catch {
      /* ignore */
    }
  }

  async function onShare() {
    await Share.share({ message: `${event!.title} — ${eventWebUrl(SITE_URL, event!)}` });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '' }} />

      <View style={styles.flyer}>
        {event.flyer_url ? (
          <Image source={{ uri: event.flyer_url }} style={styles.flyerImg} contentFit="cover" transition={200} />
        ) : null}
      </View>

      <View style={styles.pad}>
        <Text style={styles.kicker}>{EVENT_TYPE_LABELS[event.event_type]}</Text>
        <Text style={styles.title}>{event.title}</Text>

        <Row icon="🗓">
          <Text style={styles.rowStrong}>{formatEventDate(event.start_time)}</Text>
          <Text style={styles.rowText}>
            {formatEventTime(event.start_time)}
            {event.end_time ? ` – ${formatEventTime(event.end_time)}` : ''} (Jamaica time)
          </Text>
        </Row>

        {v ? (
          <Row icon="📍">
            <Text style={styles.rowStrong}>{v.name}</Text>
            {v.address ? <Text style={styles.rowText}>{v.address}</Text> : null}
            {event.parish ? <Text style={styles.rowText}>{event.parish}</Text> : null}
          </Row>
        ) : null}

        <Row icon="🎟">
          <Text style={styles.rowStrong}>{priceBadge(event)}</Text>
        </Row>

        {event.organizer ? (
          <Row icon="👤">
            <Text style={styles.rowText}>{event.organizer}</Text>
          </Row>
        ) : null}

        <View style={styles.actions}>
          {event.ticket_url ? (
            <Pressable style={[styles.btn, styles.btnGold]} onPress={() => WebBrowser.openBrowserAsync(event.ticket_url!)}>
              <Text style={styles.btnGoldText}>Get Tickets</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onToggleFavorite}>
            <Text style={styles.btnGhostText}>{fav ? '❤️ Saved' : '🤍 Save'}</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onShare}>
            <Text style={styles.btnGhostText}>↗ Share</Text>
          </Pressable>
        </View>

        {event.description ? <Text style={styles.prose}>{event.description}</Text> : null}

        {hasGeo ? (
          <View style={styles.map}>
            <EventMap latitude={v!.lat!} longitude={v!.lng!} />
          </View>
        ) : null}

        {hasGeo ? (
          <Pressable
            style={[styles.btn, styles.btnGhost, { marginTop: spacing.md }]}
            onPress={() =>
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${v!.lat},${v!.lng}`)
            }
          >
            <Text style={styles.btnGhostText}>Directions</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Row({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  flyer: { width: '100%', aspectRatio: 4 / 5, backgroundColor: '#DFEAE2' },
  flyerImg: { width: '100%', height: '100%' },
  pad: { padding: spacing.lg },
  kicker: { color: colors.greenDark, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 4, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowIcon: { fontSize: 18, width: 24 },
  rowStrong: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  rowText: { color: colors.inkSoft, fontSize: 15, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.lg },
  btn: { borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  btnGold: { backgroundColor: colors.gold },
  btnGoldText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  btnGhostText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  prose: { color: colors.inkSoft, fontSize: 15, lineHeight: 24, marginTop: spacing.sm },
  map: { height: 180, borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.lg, backgroundColor: '#E9EFE9' },
});

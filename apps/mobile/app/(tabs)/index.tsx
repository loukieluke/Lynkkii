import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchEvents } from '@irie/api';
import type { FeedEvent } from '@irie/types';
import { EventCard } from '@/components/EventCard';
import { isConfigured, supabase } from '@/lib/supabase';
import { useFilters } from '@/lib/filters';
import { colors, radius, spacing } from '@/lib/theme';

const PAGE = 20;

export default function FeedScreen() {
  const router = useRouter();
  const { filters, patch, activeCount } = useFilters();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(filters.q ?? '');

  const load = useCallback(
    async (reset: boolean) => {
      if (!isConfigured) {
        setError('unconfigured');
        setLoading(false);
        return;
      }
      const offset = reset ? 0 : events.length;
      try {
        const batch = await searchEvents(supabase, { ...filters, limit: PAGE, offset });
        setError(null);
        setHasMore(batch.length === PAGE);
        setEvents((prev) => (reset ? batch : [...prev, ...batch]));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    },
    [filters, events.length],
  );

  useEffect(() => {
    setLoading(true);
    load(true).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    await load(false);
    setLoadingMore(false);
  }, [loadingMore, hasMore, loading, load]);

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={events}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => <EventCard event={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.search}
              placeholder="Search events, artists, venues…"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => patch({ q: query.trim() || undefined })}
              returnKeyType="search"
            />
            <Pressable style={styles.filterBtn} onPress={() => router.push('/filters')}>
              <Text style={styles.filterBtnText}>Filters{activeCount ? ` · ${activeCount}` : ''}</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.green} />
        ) : error === 'unconfigured' ? (
          <Notice title="Connect Supabase" body="Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then reload." />
        ) : error ? (
          <Notice title="Couldn’t load events" body={error} />
        ) : (
          <Notice title="No upcoming events match" body="Try clearing a filter or searching something else." />
        )
      }
      ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={colors.green} /> : null}
    />
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  search: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.ink,
  },
  filterBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterBtnText: { color: colors.white, fontWeight: '700' },
  notice: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  noticeTitle: { fontWeight: '800', fontSize: 17, color: colors.ink, marginBottom: 6 },
  noticeBody: { color: colors.muted, textAlign: 'center' },
});

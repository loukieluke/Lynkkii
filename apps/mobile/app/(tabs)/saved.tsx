import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listFavoriteEvents } from '@irie/api';
import type { FeedEvent } from '@irie/types';
import { EventCard } from '@/components/EventCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useFavorites } from '@/lib/favorites';
import { colors, radius, spacing } from '@/lib/theme';

export default function SavedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { ids } = useFavorites();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!session) {
        setEvents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      listFavoriteEvents(supabase)
        .then((data) => {
          if (active) setEvents(data);
        })
        .catch(() => {
          if (active) setEvents([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [session, ids.size]),
  );

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Save your favorites</Text>
        <Text style={styles.body}>Sign in to keep a list of events you don’t want to miss.</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/sign-in')}>
          <Text style={styles.btnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={events}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => <EventCard event={item} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.title}>No saved events yet</Text>
          <Text style={styles.body}>Tap the heart on any event to save it here.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontWeight: '800', fontSize: 20, color: colors.ink },
  body: { color: colors.muted, textAlign: 'center' },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});

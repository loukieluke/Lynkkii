import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { searchEvents, priceBadge } from '@irie/api';
import type { FeedEvent } from '@irie/types';
import { isConfigured, supabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/theme';

const JAMAICA: Region = {
  latitude: 18.05,
  longitude: -77.3,
  latitudeDelta: 1.6,
  longitudeDelta: 1.6,
};

export default function MapScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    searchEvents(supabase, { limit: 200 })
      .then((all) => setEvents(all.filter((e) => e.venue?.lat != null && e.venue?.lng != null)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  if (!isConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.notice}>Connect Supabase to see the map.</Text>
      </View>
    );
  }

  return (
    <MapView style={StyleSheet.absoluteFill} initialRegion={JAMAICA}>
      {events.map((e) => (
        <Marker
          key={e.id}
          coordinate={{ latitude: e.venue!.lat!, longitude: e.venue!.lng! }}
          title={e.title}
          description={`${e.venue?.name ?? ''} · ${priceBadge(e)}`}
          pinColor={colors.green}
          onCalloutPress={() => router.push(`/event/${e.slug ?? e.id}`)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  notice: { color: colors.muted, fontSize: 16, textAlign: 'center' },
});

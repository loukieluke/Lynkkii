import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { EVENT_TYPES, EVENT_TYPE_LABELS, PARISHES, type EventType, type Parish, type PriceFilter } from '@lynkkii/types';
import { useFilters } from '@/lib/filters';
import { colors, radius, spacing } from '@/lib/theme';

const NEAR_RADIUS_KM = 25;

export default function FiltersScreen() {
  const router = useRouter();
  const { filters, setFilters } = useFilters();

  const [types, setTypes] = useState<EventType[]>(filters.event_type ?? []);
  const [parish, setParish] = useState<Parish | undefined>(filters.parish?.[0]);
  const [price, setPrice] = useState<PriceFilter>(filters.price_type ?? 'any');
  const [near, setNear] = useState(filters.near);
  const [locating, setLocating] = useState(false);

  function toggleType(t: EventType) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function toggleNear() {
    if (near) {
      setNear(undefined);
      return;
    }
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      setNear({ lat: pos.coords.latitude, lng: pos.coords.longitude, radius_km: NEAR_RADIUS_KM });
    } finally {
      setLocating(false);
    }
  }

  function apply() {
    setFilters({
      ...filters,
      event_type: types.length ? types : undefined,
      parish: parish ? [parish] : undefined,
      price_type: price !== 'any' ? price : undefined,
      near,
    });
    router.back();
  }

  function clearAll() {
    setTypes([]);
    setParish(undefined);
    setPrice('any');
    setNear(undefined);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Type">
          <View style={styles.chips}>
            {EVENT_TYPES.map((t) => (
              <Chip key={t} label={EVENT_TYPE_LABELS[t]} active={types.includes(t)} onPress={() => toggleType(t)} />
            ))}
          </View>
        </Section>

        <Section title="Price">
          <View style={styles.chips}>
            {(['any', 'free', 'paid'] as PriceFilter[]).map((p) => (
              <Chip key={p} label={p[0].toUpperCase() + p.slice(1)} active={price === p} onPress={() => setPrice(p)} />
            ))}
          </View>
        </Section>

        <Section title="Near me">
          <Chip
            label={locating ? 'Locating…' : near ? '📍 On (25km)' : '📍 Use my location'}
            active={Boolean(near)}
            onPress={toggleNear}
          />
        </Section>

        <Section title="Parish">
          <View style={styles.chips}>
            {PARISHES.map((p) => (
              <Chip key={p} label={p} active={parish === p} onPress={() => setParish(parish === p ? undefined : p)} />
            ))}
          </View>
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={clearAll}>
          <Text style={styles.btnGhostText}>Clear</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={apply}>
          <Text style={styles.btnPrimaryText}>Show events</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  sectionTitle: { fontWeight: '800', fontSize: 15, color: colors.ink, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.inkSoft, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.white },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  btnGhostText: { color: colors.ink, fontWeight: '700' },
  btnPrimary: { backgroundColor: colors.green, flex: 2 },
  btnPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});

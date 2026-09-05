import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/lib/theme';

/** Fallback route file required by expo-router when platform variants exist. */
export default function MapScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Map (native only)</Text>
      <Text style={styles.notice}>
        The events map needs iOS/Android. Use the Feed and Saved tabs here in the browser, or run a
        simulator/device build for the full map.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  notice: { color: colors.muted, fontSize: 16, textAlign: 'center', lineHeight: 22 },
});

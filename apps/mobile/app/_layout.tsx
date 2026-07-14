import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';
import { FavoritesProvider } from '@/lib/favorites';
import { FiltersProvider } from '@/lib/filters';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <FiltersProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.ink,
                headerTitleStyle: { fontWeight: '800' },
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="event/[slug]" options={{ title: '' }} />
              <Stack.Screen
                name="filters"
                options={{ presentation: 'modal', title: 'Filters' }}
              />
              <Stack.Screen
                name="sign-in"
                options={{ presentation: 'modal', title: 'Sign in' }}
              />
            </Stack>
          </FiltersProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

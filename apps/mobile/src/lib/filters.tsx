import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventFilters } from '@irie/types';

const STORAGE_KEY = 'irie:filters:v1';

type FiltersContextValue = {
  filters: EventFilters;
  setFilters: (next: EventFilters) => void;
  patch: (partial: Partial<EventFilters>) => void;
  activeCount: number;
};

const FiltersContext = createContext<FiltersContextValue | undefined>(undefined);

function countActive(f: EventFilters): number {
  let n = 0;
  if (f.parish?.length) n += 1;
  if (f.event_type?.length) n += 1;
  if (f.price_type && f.price_type !== 'any') n += 1;
  if (f.near) n += 1;
  if (f.q?.trim()) n += 1;
  return n;
}

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<EventFilters>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as EventFilters;
          // don't persist a stale "near me" location across sessions
          delete parsed.near;
          setFiltersState(parsed);
        } catch {
          /* ignore */
        }
      }
    });
  }, []);

  function persist(next: EventFilters) {
    setFiltersState(next);
    const { near, ...rest } = next;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setFilters: persist,
      patch: (partial) => persist({ ...filters, ...partial }),
      activeCount: countActive(filters),
    }),
    [filters],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}

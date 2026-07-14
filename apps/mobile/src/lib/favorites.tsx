import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addFavorite, listFavoriteIds, removeFavorite } from '@irie/api';
import { supabase } from './supabase';
import { useAuth } from './auth';

type FavoritesContextValue = {
  ids: Set<string>;
  isFavorite: (eventId: string) => boolean;
  toggle: (eventId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!session) {
      setIds(new Set());
      return;
    }
    try {
      const list = await listFavoriteIds(supabase);
      setIds(new Set(list));
    } catch {
      /* ignore transient errors */
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (eventId: string) => {
      if (!session) throw new Error('Sign in to save events');
      const has = ids.has(eventId);
      // optimistic update
      setIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(eventId);
        else next.add(eventId);
        return next;
      });
      try {
        if (has) await removeFavorite(supabase, eventId);
        else await addFavorite(supabase, eventId);
      } catch (e) {
        void refresh();
        throw e;
      }
    },
    [ids, session, refresh],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ ids, isFavorite: (id: string) => ids.has(id), toggle, refresh }),
    [ids, toggle, refresh],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

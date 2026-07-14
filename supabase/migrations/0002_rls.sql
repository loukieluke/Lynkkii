-- =============================================================================
-- Row Level Security (brief Section 4 + Global rule: app is read-only).
--   events, venues, sources  -> publicly readable, writable only by service role
--   favorites                -> readable/writable only by their owner
-- The service_role key bypasses RLS entirely, so admin/seed/ingestion writes
-- work without any explicit write policy.
-- =============================================================================

alter table events    enable row level security;
alter table venues    enable row level security;
alter table favorites enable row level security;
alter table sources   enable row level security;

-- Public read access to the canonical catalog --------------------------------
create policy "events are publicly readable"
  on events for select
  using (true);

create policy "venues are publicly readable"
  on venues for select
  using (true);

-- Favorites: owner-only --------------------------------------------------------
create policy "users can read their own favorites"
  on favorites for select
  using (auth.uid() = user_id);

create policy "users can add their own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own favorites"
  on favorites for delete
  using (auth.uid() = user_id);

-- sources: no public policy at all -> readable/writable by service role only
-- (RLS enabled with zero policies = deny all for anon/authenticated).

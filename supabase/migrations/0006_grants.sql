-- =============================================================================
-- 0006 — Table-level privileges for the API roles.
--
-- RLS decides WHICH ROWS a role may see; it does NOT grant the base table
-- privilege. Our tables ended up without SELECT for anon/authenticated, so
-- every PostgREST read (and the SECURITY INVOKER search_events RPC) failed with
-- "permission denied for table events". Grant the DML each role legitimately
-- needs and let the existing RLS policies constrain the rows.
-- =============================================================================

grant usage on schema public to anon, authenticated;

-- Public catalog: read-only for everyone. RLS still hides unpublished events.
grant select on events to anon, authenticated;
grant select on venues to anon, authenticated;
grant select on sources to anon, authenticated;

-- Per-user data: signed-in users manage only their own rows (enforced by RLS).
grant select, insert, delete on favorites to authenticated;
grant select, insert, update, delete on push_tokens to authenticated;

-- Keep future tables in this schema readable without another migration.
alter default privileges in schema public grant select on tables to anon, authenticated;

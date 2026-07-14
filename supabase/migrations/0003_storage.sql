-- =============================================================================
-- Supabase Storage: public bucket for event flyer images.
-- Flyers are the product, so the bucket is publicly readable; uploads are
-- restricted to the service role (admin curation tool / ingestion worker).
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('flyers', 'flyers', true)
on conflict (id) do nothing;

-- Public can read flyer objects ----------------------------------------------
create policy "flyers are publicly readable"
  on storage.objects for select
  using (bucket_id = 'flyers');

-- Only the service role uploads/updates/deletes flyers.
-- (No insert/update/delete policy for anon/authenticated => denied.
--  service_role bypasses RLS.)

-- ============================================================
-- AstroVastu Pro — add workspace_phase to layouts
-- Phase 'setup'  = upload + boundary + center + chakra + save
-- Phase 'full'   = all tools (devta, mark objects, PDF, etc.)
-- ============================================================

alter table public.layouts
  add column if not exists workspace_phase text not null default 'setup'
    check (workspace_phase in ('setup', 'full'));

-- Back-fill only layouts that already have a usable boundary.
-- Incomplete layouts must stay in setup so users cannot bypass boundary setup.
update public.layouts
  set workspace_phase = 'full'
  where workspace_phase = 'setup'
    and jsonb_array_length(coalesce(boundary, '[]'::jsonb)) >= 3;

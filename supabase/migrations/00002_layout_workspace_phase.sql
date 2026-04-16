-- ============================================================
-- AstroVastu Pro — add workspace_phase to layouts
-- Phase 'setup'  = upload + boundary + center + chakra + save
-- Phase 'full'   = all tools (devta, mark objects, PDF, etc.)
-- ============================================================

alter table public.layouts
  add column if not exists workspace_phase text not null default 'setup'
    check (workspace_phase in ('setup', 'full'));

-- Back-fill: existing layouts (pre-phase rollout) go straight to 'full'
-- so nothing breaks for users mid-project.
update public.layouts
  set workspace_phase = 'full'
  where workspace_phase = 'setup'
    and (
      jsonb_array_length(coalesce(boundary, '[]'::jsonb)) >= 3
      or created_at < now() - interval '1 minute'
    );

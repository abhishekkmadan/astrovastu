-- ============================================================
-- AstroVastu Pro - enforce ownership across layout relationships
-- ============================================================

drop policy if exists "Users can CRUD own layouts" on public.layouts;

create policy "Users can CRUD own layouts"
  on public.layouts for all
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.projects
      where projects.id = layouts.project_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.projects
      where projects.id = layouts.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own markers" on public.layout_markers;

create policy "Users can CRUD own markers"
  on public.layout_markers for all
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.layouts
      where layouts.id = layout_markers.layout_id
        and layouts.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.layouts
      where layouts.id = layout_markers.layout_id
        and layouts.user_id = auth.uid()
    )
  );

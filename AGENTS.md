<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Multi-agent workflow (AstroVastu)

**Branch prefix:** use `cursor/<short-description>` for agent-driven work (e.g. `cursor/razorpay-webhook`).

### When to use what

- **Main chat agent:** Default. Feature work, tight edit-run-fix loops, coupled changes (especially `src/components/vastu-editor/` canvas).
- **Explore subagent (readonly):** Map the repo before big changes — where auth, PDF, editor, `supabase/migrations` live. Do not use for implementation.
- **generalPurpose subagent:** Isolated vertical slices (e.g. one API route + webhook + DB field) with clear handoff.
- **Shell subagent:** Git worktrees, batch commands — not for ordinary `npm run dev`.

**Split subagents** by subsystem (payments vs editor vs SQL), not by random files. **Avoid** two parallel agents on the same hot file (e.g. `EditorCanvas.tsx`) without a merge owner.

### Subagent brief template

Paste this (filled in) at the start of a Task:

```
Goal:
Acceptance criteria (done when):
Branch: cursor/___
Base branch: main (or other)
Touch / do not touch:
  - OK:
  - Avoid:
Env / secrets (names only, no values):
Links / prior findings:
```

Handoff rule: after an Explore task, paste its file map into main chat before implementing.

### One-line rule

Split by subsystem or phase (explore → implement); keep **one thread** for tightly coupled UI/canvas.

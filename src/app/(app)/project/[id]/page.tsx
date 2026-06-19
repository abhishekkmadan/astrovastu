import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project, Layout } from "@/types/database";
import { Plus, FileText, Pencil, Upload } from "lucide-react";
import { DeleteLayoutButton } from "./DeleteLayoutButton";
import { ProjectDetailsForm } from "./ProjectDetailsForm";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const { data: layouts } = await supabase
    .from("layouts")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const p = project as Project;
  const safeLayouts: Layout[] = (layouts as Layout[]) ?? [];
  const reportLayout = safeLayouts.find((layout) => layout.workspace_phase === "full");

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/dashboard" className="hover:text-text">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-text font-medium">Project Details</span>
      </div>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{p.name}</h1>
          <p className="text-text-muted text-sm">Client: {p.client_name}</p>
        </div>
        {reportLayout ? (
          <Link
            href={`/api/pdf/${reportLayout.id}`}
            target="_blank"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <FileText size={16} />
            Generate PDF
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="Complete a layout setup before generating a PDF"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            <FileText size={16} />
            Generate PDF
          </button>
        )}
      </div>

      {/* Layouts and Kundlis sections */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Vastu Layouts ({safeLayouts.length})
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Upload a floor plan image (your map) to draw boundaries and overlay the
                Shakti Chakra.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/project/${id}/layout/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark"
              >
                <Upload size={16} />
                Upload map
              </Link>
              <Link
                href={`/project/${id}/layout/new`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 text-accent hover:bg-accent/10"
                title="Add another layout"
              >
                <Plus size={18} />
              </Link>
            </div>
          </div>
          {safeLayouts.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-surface-border bg-surface-dim/50 p-6 text-center">
              <p className="text-sm text-text-muted">
                No floor plan uploaded yet.
              </p>
              <Link
                href={`/project/${id}/layout/new`}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                <Upload size={16} />
                Upload floor plan
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {safeLayouts.map((l) => {
                const inSetup = l.workspace_phase === "setup";
                const href = inSetup
                  ? `/project/${id}/layout/${l.id}/setup`
                  : `/project/${id}/layout/${l.id}/edit`;
                return (
                  <li
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border border-surface-border p-3"
                  >
                    <Link href={href} className="flex items-center gap-3 hover:text-primary">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Pencil size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {l.name}
                          {inSetup && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 align-middle">
                              Setup pending
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(l.created_at).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                    <DeleteLayoutButton layoutId={l.id} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Astro Kundlis (0)</h2>
            <button
              disabled
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-dim text-text-muted cursor-not-allowed"
              title="Coming soon"
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="mt-4 text-sm text-text-muted">Coming soon.</p>
        </section>
      </div>

      {/* Project Details */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Project Details</h2>
        <ProjectDetailsForm project={p} />
      </section>
    </div>
  );
}

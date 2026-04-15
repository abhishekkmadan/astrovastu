import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project, Layout } from "@/types/database";
import { Plus, FileText, Pencil } from "lucide-react";
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
        <Link
          href={`/api/pdf/${id}?type=project`}
          target="_blank"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <FileText size={16} />
          Generate PDF
        </Link>
      </div>

      {/* Layouts and Kundlis sections */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Vastu Layouts ({safeLayouts.length})
            </h2>
            <Link
              href={`/project/${id}/layout/new`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-dark"
            >
              <Plus size={16} />
            </Link>
          </div>
          {safeLayouts.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">
              No layouts yet. Add one to start your Vastu analysis.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {safeLayouts.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border border-surface-border p-3"
                >
                  <Link
                    href={`/project/${id}/layout/${l.id}/edit`}
                    className="flex items-center gap-3 hover:text-primary"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Pencil size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(l.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                  <DeleteLayoutButton layoutId={l.id} />
                </li>
              ))}
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

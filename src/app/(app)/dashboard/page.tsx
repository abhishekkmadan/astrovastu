import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types/database";
import { Plus, LayoutGrid, Star } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { count: layoutCount } = await supabase
    .from("layouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const safeProjects: Project[] = (projects as Project[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome!</h1>
          <p className="mt-1 text-text-muted">
            Overview of your AstroVastu Pro analysis.
          </p>
        </div>
        <Link
          href="/project/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} />
          New Project
        </Link>
      </div>

      {/* At a Glance */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutGrid size={24} />
          </div>
          <div>
            <p className="text-sm text-text-muted">Vastu Layouts</p>
            <p className="text-2xl font-bold">{layoutCount ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm text-text-muted">Astro Kundlis</p>
            <p className="text-2xl font-bold text-text-muted">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <h2 className="mt-10 text-xl font-semibold">Recent Projects</h2>
      {safeProjects.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-border py-16 text-center">
          <p className="text-text-muted">No projects yet.</p>
          <Link
            href="/project/new"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {safeProjects.map((p) => (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              className="group rounded-xl border border-surface-border bg-surface overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-5xl opacity-30">&#9784;</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Client: {p.client_name}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {new Date(p.updated_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

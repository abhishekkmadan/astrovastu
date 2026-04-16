"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const projectTypes = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "temple", label: "Temple" },
  { value: "other", label: "Other" },
];

const languages = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "bengali", label: "Bengali" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "marathi", label: "Marathi" },
];

const statuses = [
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: fd.get("name") as string,
        client_name: fd.get("client_name") as string,
        location: fd.get("location") as string,
        language: fd.get("language") as string,
        project_type: fd.get("project_type") as string,
        status: (fd.get("status") as string) || "in_progress",
      })
      .select("id")
      .single();

    if (insertError) {
      const isMissingTable =
        insertError.code === "PGRST205" ||
        insertError.message.includes("schema cache");
      const isMissingProfile =
        insertError.code === "23503" &&
        insertError.message.includes("projects_user_id_fkey");
      setError(
        isMissingTable
          ? "Database tables are missing. In Supabase → SQL Editor, run the files in supabase/migrations/ (start with 00001_initial_schema.sql, then 00002_layout_workspace_phase.sql), then try again."
          : isMissingProfile
            ? "Your profile row is missing. In Supabase → SQL Editor, run: insert into public.profiles (id, email, full_name) select id, email, coalesce(raw_user_meta_data ->> 'full_name','') from auth.users on conflict (id) do nothing;"
            : insertError.message
      );
      setLoading(false);
    } else {
      router.push(`/project/${data.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">New Project</h1>
      <p className="mt-1 text-text-muted text-sm">
        Fill in the project details to get started.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input id="name" name="name" label="Project Name *" required placeholder="e.g. Casa Greens" />
          <Input id="client_name" name="client_name" label="Client Name *" required placeholder="Client name" />
        </div>
        <Input id="location" name="location" label="Location *" required placeholder="City or address" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select id="language" name="language" label="Language" options={languages} />
          <Select id="project_type" name="project_type" label="Project Type" options={projectTypes} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select id="status" name="status" label="Project Status" options={statuses} />
          <div>
            <label className="block text-sm font-medium text-text-muted">Created on</label>
            <div className="mt-1 rounded-lg border border-surface-border bg-surface-dim px-3 py-2 text-sm text-text-muted">
              {new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

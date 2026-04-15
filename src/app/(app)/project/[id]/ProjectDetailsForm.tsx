"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types/database";
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

const statuses = [
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const languages = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "bengali", label: "Bengali" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "marathi", label: "Marathi" },
];

export function ProjectDetailsForm({ project }: { project: Project }) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await supabase
      .from("projects")
      .update({
        name: fd.get("name") as string,
        client_name: fd.get("client_name") as string,
        location: fd.get("location") as string,
        language: fd.get("language") as string,
        project_type: fd.get("project_type") as string,
        status: fd.get("status") as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);
    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="mt-4 rounded-xl border border-surface-border p-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-dark"
        >
          ✎
        </button>
      </div>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <Input
          id="name"
          name="name"
          label="Project Name *"
          defaultValue={project.name}
          disabled={!editing}
          required
        />
        <Input
          id="client_name"
          name="client_name"
          label="Client Name *"
          defaultValue={project.client_name}
          disabled={!editing}
          required
        />
        <Input
          id="location"
          name="location"
          label="Location *"
          defaultValue={project.location}
          disabled={!editing}
          required
        />
        <Select
          id="language"
          name="language"
          label="Language"
          options={languages}
          defaultValue={project.language}
          disabled={!editing}
        />
        <Select
          id="project_type"
          name="project_type"
          label="Project Type"
          options={projectTypes}
          defaultValue={project.project_type}
          disabled={!editing}
        />
        <Select
          id="status"
          name="status"
          label="Project Status"
          options={statuses}
          defaultValue={project.status}
          disabled={!editing}
        />
        <Input
          label="Created On"
          value={new Date(project.created_at).toLocaleString()}
          disabled
        />
        <Input
          label="Modified On"
          value={new Date(project.updated_at).toLocaleString()}
          disabled
        />
      </div>
      {editing && (
        <div className="mt-4 flex gap-3">
          <Button type="submit" loading={loading}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}

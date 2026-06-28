"use client";

import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload } from "lucide-react";

export default function NewLayoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please upload a floor plan image.");
      return;
    }
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (projectErr || !project) {
      setError("Project not found");
      setLoading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${params.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("floor-plans")
      .upload(path, file);

    if (uploadErr) {
      setError(uploadErr.message);
      setLoading(false);
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("layouts")
      .insert({
        project_id: params.id,
        user_id: user.id,
        name: name || file.name,
        image_path: path,
        boundary: [],
        center: { x: 0.5, y: 0.5 },
        north_degrees: 0,
      })
      .select("id")
      .single();

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
    } else {
      // New layouts start in setup phase: boundary + centre + chakra + save
      router.push(`/project/${params.id}/layout/${data.id}/setup`);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Upload your map</h1>
      <p className="mt-1 text-sm text-text-muted">
        Choose your floor plan image (PNG, JPG, WEBP). This becomes the map you mark in
        the editor.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          id="name"
          label="Layout Name"
          placeholder="e.g. Ground Floor"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="text-sm font-medium text-text-muted">
            Map image *
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-border p-8 hover:border-primary/40 transition-colors"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-lg object-contain"
              />
            ) : (
              <>
                <Upload size={32} className="text-text-muted" />
                <p className="mt-2 text-sm text-text-muted">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-text-muted/60">
                  PNG, JPG up to 10MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Upload & Continue
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

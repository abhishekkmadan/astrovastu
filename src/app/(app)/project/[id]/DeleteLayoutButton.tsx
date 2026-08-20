"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export function DeleteLayoutButton({ layoutId }: { layoutId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this layout? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    const { error: deleteError } = await supabase.from("layouts").delete().eq("id", layoutId);
    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        title={error ? `Delete failed: ${error}` : "Delete layout"}
      >
        <Trash2 size={14} />
      </button>
      {error && <p className="max-w-40 text-right text-xs text-danger">Delete failed</p>}
    </div>
  );
}

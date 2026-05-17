"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export function DeleteLayoutButton({ layoutId }: { layoutId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (!confirm("Delete this layout? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("layouts").delete().eq("id", layoutId);
      if (error) {
        alert(`Could not delete layout: ${error.message}`);
        return;
      }
      router.refresh();
    } catch (error) {
      alert(`Could not delete layout: ${errorMessage(error)}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg p-2 text-text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
      title="Delete layout"
    >
      <Trash2 size={14} />
    </button>
  );
}

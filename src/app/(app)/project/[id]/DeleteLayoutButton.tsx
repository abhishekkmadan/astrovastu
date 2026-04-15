"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export function DeleteLayoutButton({ layoutId }: { layoutId: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    if (!confirm("Delete this layout? This cannot be undone.")) return;
    await supabase.from("layout_markers").delete().eq("layout_id", layoutId);
    await supabase.from("layouts").delete().eq("id", layoutId);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
      title="Delete layout"
    >
      <Trash2 size={14} />
    </button>
  );
}

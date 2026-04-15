import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Layout, LayoutMarker } from "@/types/database";
import { VastuEditorWrapper } from "@/components/vastu-editor/VastuEditorWrapper";

export default async function LayoutEditPage({
  params,
}: {
  params: Promise<{ id: string; layoutId: string }>;
}) {
  const { id: projectId, layoutId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: layout } = await supabase
    .from("layouts")
    .select("*")
    .eq("id", layoutId)
    .eq("user_id", user.id)
    .single();

  if (!layout) notFound();

  const { data: markers } = await supabase
    .from("layout_markers")
    .select("*")
    .eq("layout_id", layoutId)
    .order("created_at");

  let imageUrl = "";
  if (layout.image_path) {
    const { data: signed } = await supabase.storage
      .from("floor-plans")
      .createSignedUrl(layout.image_path, 3600);
    imageUrl = signed?.signedUrl ?? "";
  }

  return (
    <VastuEditorWrapper
      projectId={projectId}
      layout={{ ...layout, image_url: imageUrl } as Layout}
      markers={(markers as LayoutMarker[]) ?? []}
    />
  );
}

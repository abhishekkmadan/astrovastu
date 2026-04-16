import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Layout } from "@/types/database";
import { VastuEditorWrapper } from "@/components/vastu-editor/VastuEditorWrapper";

export default async function LayoutSetupPage({
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

  // If setup is already complete, go straight to the full workspace.
  if ((layout as Layout).workspace_phase === "full") {
    redirect(`/project/${projectId}/layout/${layoutId}/edit`);
  }

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
      markers={[]}
      workspacePhase="setup"
    />
  );
}

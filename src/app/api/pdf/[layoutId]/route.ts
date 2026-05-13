import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import type { LayoutMarker } from "@/types/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  const { layoutId: requestedId } = await params;
  const reportType = new URL(request.url).searchParams.get("type");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: layout } =
    reportType === "project"
      ? await supabase
          .from("layouts")
          .select("*, projects(*)")
          .eq("project_id", requestedId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await supabase
          .from("layouts")
          .select("*, projects(*)")
          .eq("id", requestedId)
          .eq("user_id", user.id)
          .maybeSingle();

  if (!layout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: markers } = await supabase
    .from("layout_markers")
    .select("*")
    .eq("layout_id", layout.id)
    .order("created_at");

  const project = layout.projects as Record<string, string>;
  const safeMarkers: LayoutMarker[] = (markers as LayoutMarker[]) ?? [];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // --- Cover Page ---
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("AstroVastu Pro", pageW / 2, 40, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Vastu Analysis Report", pageW / 2, 50, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(project?.name ?? "Project", pageW / 2, 75, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const details = [
    `Client: ${project?.client_name ?? "—"}`,
    `Location: ${project?.location ?? "—"}`,
    `Layout: ${layout.name}`,
    `Type: ${project?.project_type ?? "—"}`,
    `Date: ${new Date().toLocaleDateString()}`,
  ];
  details.forEach((line, i) => {
    doc.text(line, pageW / 2, 90 + i * 7, { align: "center" });
  });

  // --- Markers Summary Page ---
  if (safeMarkers.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Object Markings & Remedies", 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const colX = [14, 40, 80, 110];
    const headerY = 32;
    doc.text("Type", colX[0], headerY);
    doc.text("Label", colX[1], headerY);
    doc.text("Verdict", colX[2], headerY);
    doc.text("Remedy", colX[3], headerY);

    doc.setDrawColor(200);
    doc.line(14, headerY + 2, pageW - 14, headerY + 2);

    doc.setFont("helvetica", "normal");
    let y = headerY + 8;
    for (const m of safeMarkers) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(m.kind, colX[0], y);
      doc.text(m.label, colX[1], y);

      const verdictColor =
        m.verdict === "good"
          ? [39, 174, 96]
          : m.verdict === "bad"
          ? [231, 76, 60]
          : [243, 156, 18];
      doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
      doc.text(m.verdict.toUpperCase(), colX[2], y);
      doc.setTextColor(0, 0, 0);

      const remedyLines = doc.splitTextToSize(m.remedy || "—", pageW - colX[3] - 14);
      doc.text(remedyLines, colX[3], y);
      y += Math.max(remedyLines.length, 1) * 5 + 3;
    }
  }

  const buffer = doc.output("arraybuffer");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${project?.name ?? "report"}-vastu-report.pdf"`,
    },
  });
}

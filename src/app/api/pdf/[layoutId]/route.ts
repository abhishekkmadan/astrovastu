import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import type { Layout, LayoutMarker, Project } from "@/types/database";

type LayoutWithProject = Layout & { projects?: Project | null };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  const { layoutId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reportType = new URL(request.url).searchParams.get("type");

  if (reportType === "project") {
    return generateProjectReport(layoutId, user.id, supabase);
  }

  const { data: layout } = await supabase
    .from("layouts")
    .select("*, projects(*)")
    .eq("id", layoutId)
    .eq("user_id", user.id)
    .single();

  if (!layout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: markers } = await supabase
    .from("layout_markers")
    .select("*")
    .eq("layout_id", layoutId)
    .order("created_at");

  const safeLayout = layout as LayoutWithProject;
  const project = safeLayout.projects;
  const safeMarkers: LayoutMarker[] = (markers as LayoutMarker[]) ?? [];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // --- Cover Page ---
  addCoverPage(doc, {
    title: project?.name ?? "Project",
    subtitle: "Vastu Analysis Report",
    details: [
      `Client: ${project?.client_name ?? "-"}`,
      `Location: ${project?.location ?? "-"}`,
      `Layout: ${safeLayout.name}`,
      `Type: ${project?.project_type ?? "-"}`,
      `Date: ${new Date().toLocaleDateString()}`,
    ],
  });

  // --- Markers Summary Page ---
  if (safeMarkers.length > 0) {
    doc.addPage();
    addMarkersSummary(doc, "Object Markings & Remedies", safeMarkers);
  }

  return pdfResponse(doc, `${project?.name ?? "report"}-vastu-report.pdf`);
}

async function generateProjectReport(
  projectId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: layoutsRaw, error: layoutsError } = await supabase
    .from("layouts")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (layoutsError) {
    return NextResponse.json({ error: layoutsError.message }, { status: 500 });
  }

  const layouts: Layout[] = (layoutsRaw as Layout[]) ?? [];
  const markersByLayout = new Map<string, LayoutMarker[]>();

  if (layouts.length > 0) {
    const { data: markersRaw, error: markersError } = await supabase
      .from("layout_markers")
      .select("*")
      .eq("user_id", userId)
      .in(
        "layout_id",
        layouts.map((layout) => layout.id)
      )
      .order("created_at");

    if (markersError) {
      return NextResponse.json({ error: markersError.message }, { status: 500 });
    }

    for (const marker of (markersRaw as LayoutMarker[]) ?? []) {
      const existing = markersByLayout.get(marker.layout_id) ?? [];
      existing.push(marker);
      markersByLayout.set(marker.layout_id, existing);
    }
  }

  const safeProject = project as Project;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addCoverPage(doc, {
    title: safeProject.name,
    subtitle: "Project Vastu Analysis Report",
    details: [
      `Client: ${safeProject.client_name || "-"}`,
      `Location: ${safeProject.location || "-"}`,
      `Layouts: ${layouts.length}`,
      `Type: ${safeProject.project_type || "-"}`,
      `Date: ${new Date().toLocaleDateString()}`,
    ],
  });

  if (layouts.length === 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("No layouts uploaded", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Upload a floor plan before generating a detailed Vastu report.", 14, 30);
  }

  for (const layout of layouts) {
    const markers = markersByLayout.get(layout.id) ?? [];

    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(layout.name, 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const details = [
      `Workspace phase: ${layout.workspace_phase}`,
      `Boundary points: ${layout.boundary?.length ?? 0}`,
      `North tilt: ${layout.north_degrees ?? 0} degrees`,
      `Object markings: ${markers.length}`,
    ];
    details.forEach((line, index) => {
      doc.text(line, 14, 32 + index * 7);
    });

    if (markers.length > 0) {
      doc.addPage();
      addMarkersSummary(doc, `${layout.name} - Object Markings & Remedies`, markers);
    }
  }

  return pdfResponse(doc, `${safeProject.name}-vastu-report.pdf`);
}

function addCoverPage(
  doc: jsPDF,
  {
    title,
    subtitle,
    details,
  }: {
    title: string;
    subtitle: string;
    details: string[];
  }
) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("AstroVastu Pro", pageW / 2, 40, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, pageW / 2, 50, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageW / 2, 75, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  details.forEach((line, i) => {
    doc.text(line, pageW / 2, 90 + i * 7, { align: "center" });
  });
}

function addMarkersSummary(doc: jsPDF, title: string, markers: LayoutMarker[]) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);

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
  for (const m of markers) {
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

    const remedyLines = doc.splitTextToSize(m.remedy || "-", pageW - colX[3] - 14);
    doc.text(remedyLines, colX[3], y);
    y += Math.max(remedyLines.length, 1) * 5 + 3;
  }
}

function pdfResponse(doc: jsPDF, filename: string) {
  const buffer = doc.output("arraybuffer");
  const safeFilename = filename.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename || "vastu-report.pdf"}"`,
    },
  });
}

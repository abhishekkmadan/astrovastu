"use client";

import { useState, useCallback } from "react";
import type { Layout, LayoutMarker, Point } from "@/types/database";
import { VASTU_TOOLS } from "@/types/database";
import { EditorCanvas } from "./EditorCanvas";
import { EditorToolbar } from "./EditorToolbar";
import { MarkerPanel } from "./MarkerPanel";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, FileDown } from "lucide-react";

export type EditorMode = "boundary" | "chakra" | "mark-objects" | "view";

interface Props {
  projectId: string;
  layout: Layout;
  markers: LayoutMarker[];
}

export function VastuEditorWrapper({ projectId, layout, markers: initialMarkers }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<EditorMode>("boundary");
  const [boundary, setBoundary] = useState<Point[]>(layout.boundary ?? []);
  const [center, setCenter] = useState<Point>(layout.center ?? { x: 0.5, y: 0.5 });
  const [northDegrees, setNorthDegrees] = useState(layout.north_degrees ?? 0);
  const [markers, setMarkers] = useState<LayoutMarker[]>(initialMarkers);
  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("vastu-chakra");

  const handleToolSelect = useCallback((toolKey: string) => {
    setActiveTool(toolKey);
    if (toolKey === "vastu-chakra") setMode("chakra");
    else if (toolKey === "mark-objects") setMode("mark-objects");
    else setMode("view");
  }, []);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("layouts")
      .update({
        boundary,
        center,
        north_degrees: northDegrees,
        updated_at: new Date().toISOString(),
      })
      .eq("id", layout.id);
    setSaving(false);
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2 bg-surface">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/project/${projectId}`)}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="text-sm font-medium">{layout.name}</span>
          <span className="text-xs text-text-muted">
            North Tilt: {northDegrees.toFixed(0)}°
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-surface-dim px-2 py-0.5 text-xs text-text-muted capitalize">
            {mode}
          </span>
          <a
            href={`/api/pdf/${layout.id}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm text-text-muted hover:bg-surface-dim"
          >
            <FileDown size={14} />
            PDF
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Vastu tools */}
        <aside className="w-52 shrink-0 overflow-y-auto border-r border-surface-border bg-surface p-3">
          <p className="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Vastu Tools
          </p>
          <div className="space-y-0.5">
            <button
              onClick={() => setMode("boundary")}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                mode === "boundary"
                  ? "bg-accent/10 text-accent font-medium"
                  : "hover:bg-surface-dim text-text-muted"
              }`}
            >
              Edit Boundary
            </button>
            {VASTU_TOOLS.map((tool) => (
              <button
                key={tool.key}
                disabled={!tool.enabled}
                onClick={() => handleToolSelect(tool.key)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  !tool.enabled
                    ? "text-text-muted/40 cursor-not-allowed"
                    : activeTool === tool.key && mode !== "boundary"
                    ? "bg-accent/10 text-accent font-medium"
                    : "hover:bg-surface-dim text-text-muted"
                }`}
              >
                {tool.label}
                {!tool.enabled && (
                  <span className="ml-1 text-[10px] text-text-muted/40">soon</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas area */}
        <div className="flex-1 relative bg-surface-dim overflow-hidden">
          <EditorCanvas
            imageUrl={layout.image_url ?? ""}
            mode={mode}
            boundary={boundary}
            setBoundary={setBoundary}
            center={center}
            setCenter={setCenter}
            northDegrees={northDegrees}
            setNorthDegrees={setNorthDegrees}
            markers={markers}
            setMarkers={setMarkers}
            layoutId={layout.id}
          />
          {/* North rotation slider (only in chakra mode) */}
          {mode === "chakra" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-lg bg-surface/90 border border-surface-border px-4 py-2 shadow-sm backdrop-blur-sm">
              <label className="text-xs font-medium text-text-muted whitespace-nowrap">
                North Tilt (°)
              </label>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={northDegrees}
                onChange={(e) => setNorthDegrees(Number(e.target.value))}
                className="w-48 accent-primary"
              />
              <input
                type="number"
                min={0}
                max={360}
                value={Math.round(northDegrees)}
                onChange={(e) => setNorthDegrees(Number(e.target.value) % 360)}
                className="w-14 rounded border border-surface-border px-2 py-1 text-xs text-center"
              />
            </div>
          )}
        </div>

        {/* Right panel: Marker panel */}
        {mode === "mark-objects" && (
          <MarkerPanel
            layoutId={layout.id}
            markers={markers}
            setMarkers={setMarkers}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Layout, LayoutMarker, MarkerSize, Point, WorkspacePhase } from "@/types/database";
import { VASTU_TOOLS } from "@/types/database";
import { EditorCanvas } from "./EditorCanvas";
import { DevtaInfoPanel } from "./DevtaInfoPanel";
import { ObjectMarkingBar, type PendingMarker } from "./ObjectMarkingBar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, FileDown, ArrowRight } from "lucide-react";
import { findCatalogItem } from "@/lib/vastu/object-catalog";
import { zoneIndexForPoint } from "@/lib/vastu/zone-detect";
import { lookupVerdict } from "@/lib/vastu/zone-verdicts";

export type EditorMode = "boundary" | "chakra" | "devta-marking" | "mark-objects" | "view";

interface Props {
  projectId: string;
  layout: Layout;
  markers: LayoutMarker[];
  /** Local-only mode: no Supabase; for /demo testing */
  demoMode?: boolean;
  /**
   * Two-phase layout editor:
   * - 'setup': boundary + chakra only (Save and continue → full)
   * - 'full':  complete toolbox (default, matches /demo)
   */
  workspacePhase?: WorkspacePhase;
}

export function VastuEditorWrapper({
  projectId,
  layout,
  markers: initialMarkers,
  demoMode = false,
  workspacePhase = "full",
}: Props) {
  const router = useRouter();
  // Do not create a browser Supabase client on /demo — env may be unset
  const supabase = demoMode ? null : createClient();
  const isSetupPhase = workspacePhase === "setup";

  const [mode, setMode] = useState<EditorMode>("boundary");
  const [boundary, setBoundary] = useState<Point[]>(layout.boundary ?? []);
  const [center, setCenter] = useState<Point>(layout.center ?? { x: 0.5, y: 0.5 });
  const [northDegrees, setNorthDegrees] = useState(layout.north_degrees ?? 0);
  /** Scale factor for the overlay compass only (floor plan zoom is unchanged). */
  const [chakraZoom, setChakraZoom] = useState(layout.viewport?.scale ?? 1);
  const [markers, setMarkers] = useState<LayoutMarker[]>(initialMarkers);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>("vastu-chakra");

  const [selectedDevta, setSelectedDevta] = useState<number | null>(null);

  // Mark Objects state
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [pendingMarker, setPendingMarker] = useState<PendingMarker | null>(null);
  const [savingMarker, setSavingMarker] = useState(false);
  const [markerError, setMarkerError] = useState<string | null>(null);

  /** Clears mark-objects UI state whenever leaving that mode (same places that call setMode). */
  const goToMode = useCallback((nextMode: EditorMode) => {
    if (nextMode !== "mark-objects") {
      setSelectedItemKey(null);
      setPendingMarker(null);
    }
    setMode(nextMode);
  }, []);

  const handleToolSelect = useCallback((toolKey: string) => {
    setActiveTool(toolKey);
    let nextMode: EditorMode;
    if (toolKey === "vastu-chakra") nextMode = "chakra";
    else if (toolKey === "devta-marking") nextMode = "devta-marking";
    else if (toolKey === "mark-objects") nextMode = "mark-objects";
    else nextMode = "view";
    goToMode(nextMode);
  }, [goToMode]);

  // Escape cancels the current selection / pending placement (Photoshop feel).
  useEffect(() => {
    if (mode !== "mark-objects") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pendingMarker) {
        setPendingMarker(null);
      } else if (selectedItemKey) {
        setSelectedItemKey(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, pendingMarker, selectedItemKey]);

  const handleMapSelect = useCallback(
    (pos: Point, size: MarkerSize) => {
      if (!selectedItemKey) return;
      const item = findCatalogItem(selectedItemKey);
      if (!item) return;
      const zoneIdx = zoneIndexForPoint(pos, center, northDegrees);
      const verdict = lookupVerdict(item.key, item.label, zoneIdx);
      setPendingMarker({
        pos,
        size,
        itemKey: item.key,
        itemLabel: item.label,
        kind: item.kind,
        zoneIdx,
        verdict,
      });
    },
    [selectedItemKey, center, northDegrees]
  );

  const handleSaveMarker = useCallback(
    async (remedy: string) => {
      if (!pendingMarker) return;
      setSavingMarker(true);
      setMarkerError(null);
      const { itemLabel, kind, pos, size, verdict } = pendingMarker;
      const newId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const newMarker: LayoutMarker = {
        id: newId,
        layout_id: layout.id,
        user_id: demoMode ? "demo" : "",
        kind,
        label: itemLabel,
        position: pos,
        size,
        verdict: verdict.verdict,
        remedy,
        notes: verdict.explanation,
        created_at: new Date().toISOString(),
      };

      try {
        if (!demoMode) {
          if (!supabase) {
            throw new Error("Supabase is not configured.");
          }

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError) {
            throw new Error(userError.message);
          }
          if (!user) {
            throw new Error("You must be signed in to save markers.");
          }

          newMarker.user_id = user.id;
          // Store size inside the jsonb position blob for round-tripping without
          // a schema change.
          const positionWithSize = { x: pos.x, y: pos.y, w: size.w, h: size.h };
          const { error } = await supabase.from("layout_markers").insert({
            id: newMarker.id,
            layout_id: layout.id,
            user_id: user.id,
            kind,
            label: itemLabel,
            position: positionWithSize,
            verdict: verdict.verdict,
            remedy,
            notes: verdict.explanation,
          });
          if (error) {
            throw new Error(error.message);
          }
        }

        setMarkers((prev) => [...prev, newMarker]);
        setPendingMarker(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setMarkerError(message);
        alert(`Could not save marker: ${message}`);
      } finally {
        setSavingMarker(false);
      }
    },
    [pendingMarker, layout.id, demoMode, supabase]
  );

  async function handleSave() {
    if (demoMode || !supabase) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase
        .from("layouts")
        .update({
          boundary,
          center,
          north_degrees: northDegrees,
          viewport: { x: 0, y: 0, scale: chakraZoom },
          updated_at: new Date().toISOString(),
        })
        .eq("id", layout.id);
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSaveError(message);
      alert(`Could not save layout: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndContinue() {
    if (demoMode || !supabase) {
      router.push(`/project/${projectId}/layout/${layout.id}/edit`);
      return;
    }
    if (boundary.length < 3) {
      alert("Please draw a boundary with at least 3 points before continuing.");
      goToMode("boundary");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from("layouts")
      .update({
        boundary,
        center,
        north_degrees: northDegrees,
        viewport: { x: 0, y: 0, scale: chakraZoom },
        workspace_phase: "full",
        updated_at: new Date().toISOString(),
      })
      .eq("id", layout.id);
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      alert(`Could not save: ${error.message}`);
      return;
    }
    router.push(`/project/${projectId}/layout/${layout.id}/edit`);
  }

  return (
    <div
      className={
        demoMode
          ? "flex min-h-0 flex-1 flex-col"
          : "flex h-[calc(100vh-64px)] flex-col"
      }
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2 bg-surface">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              demoMode ? router.push("/") : router.push(`/project/${projectId}`)
            }
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text"
          >
            <ArrowLeft size={16} />
            {demoMode ? "Home" : "Back"}
          </button>
          <span className="text-sm font-medium">{layout.name}</span>
          <span className="text-xs text-text-muted">
            North Tilt: {northDegrees.toFixed(0)}°
          </span>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Demo — no account
            </span>
          )}
          {isSetupPhase && (
            <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              Step 1: Setup
            </span>
          )}
          <span className="rounded bg-surface-dim px-2 py-0.5 text-xs text-text-muted capitalize">
            {mode}
          </span>
          {!demoMode && !isSetupPhase && (
            <a
              href={`/api/pdf/${layout.id}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm text-text-muted hover:bg-surface-dim"
            >
              <FileDown size={14} />
              PDF
            </a>
          )}
          {isSetupPhase ? (
            <button
              onClick={handleSaveAndContinue}
              disabled={saving || demoMode}
              title={
                demoMode
                  ? "Connect Supabase and sign in to save to cloud"
                  : boundary.length < 3
                    ? "Draw a boundary before continuing"
                    : undefined
              }
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save and continue"}
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || demoMode}
              title={demoMode ? "Connect Supabase and sign in to save to cloud" : undefined}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              <Save size={14} />
              {demoMode ? "Save (sign in)" : saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
      {saveError && (
        <div className="border-b border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
          Could not save layout: {saveError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Vastu tools */}
        <aside className="w-52 shrink-0 overflow-y-auto border-r border-surface-border bg-surface p-3">
          <p className="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Vastu Tools
          </p>
          <div className="space-y-0.5">
            <button
              onClick={() => goToMode("boundary")}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                mode === "boundary"
                  ? "bg-accent/10 text-accent font-medium"
                  : "hover:bg-surface-dim text-text-muted"
              }`}
            >
              Edit Boundary
            </button>
            {mode === "boundary" && boundary.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (!confirm("Clear all boundary points?")) return;
                  setBoundary([]);
                  setCenter({ x: 0.5, y: 0.5 });
                }}
                className="mt-1.5 w-full rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10"
              >
                Clear boundary
              </button>
            )}
            {VASTU_TOOLS.map((tool) => {
              // In setup phase, only Vastu Chakra is usable (alongside Edit Boundary).
              const lockedBySetup = isSetupPhase && tool.key !== "vastu-chakra";
              const isEnabled = tool.enabled && !lockedBySetup;
              return (
                <button
                  key={tool.key}
                  disabled={!isEnabled}
                  onClick={() => handleToolSelect(tool.key)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    !isEnabled
                      ? "text-text-muted/40 cursor-not-allowed"
                      : activeTool === tool.key && mode !== "boundary"
                      ? "bg-accent/10 text-accent font-medium"
                      : "hover:bg-surface-dim text-text-muted"
                  }`}
                  title={lockedBySetup ? "Available after Save and continue" : undefined}
                >
                  {tool.label}
                  {!tool.enabled && (
                    <span className="ml-1 text-[10px] text-text-muted/40">soon</span>
                  )}
                  {lockedBySetup && tool.enabled && (
                    <span className="ml-1 text-[10px] text-text-muted/40">step 2</span>
                  )}
                </button>
              );
            })}
          </div>
          {isSetupPhase && (
            <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs text-text-muted">
              <p className="font-medium text-accent mb-1">Setup step</p>
              <p>
                Mark the boundary, confirm the centre and rotate the Vastu Chakra
                to true North. Press <span className="font-medium">Save and continue</span>{" "}
                to unlock Devta marking, Mark objects and the PDF export.
              </p>
            </div>
          )}
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
            chakraZoom={chakraZoom}
            markers={markers}
            selectedDevta={selectedDevta}
            onSelectDevta={setSelectedDevta}
            objectPlacingActive={
              mode === "mark-objects" && !!selectedItemKey && !pendingMarker
            }
            onMapSelect={handleMapSelect}
            pendingRect={
              pendingMarker
                ? {
                    center: pendingMarker.pos,
                    size: pendingMarker.size,
                    verdict: pendingMarker.verdict.verdict,
                  }
                : null
            }
          />
          {mode === "mark-objects" && (
            <ObjectMarkingBar
              selectedItemKey={selectedItemKey}
              onSelect={(key) => {
                setSelectedItemKey(key);
                setPendingMarker(null);
              }}
              pending={pendingMarker}
              onCancel={() => setPendingMarker(null)}
              onSave={handleSaveMarker}
              saving={savingMarker}
            />
          )}
          {markerError && mode === "mark-objects" && (
            <div className="absolute bottom-28 left-1/2 z-20 w-[min(40rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger shadow-sm">
              Could not save marker: {markerError}
            </div>
          )}
          {/* North tilt + chakra size (only in chakra mode) */}
          {mode === "chakra" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col gap-2 rounded-lg bg-surface/90 border border-surface-border px-4 py-2 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
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
                  className="w-48 min-w-[8rem] accent-primary"
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
              <div className="flex items-center gap-3 border-t border-surface-border pt-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                <label className="text-xs font-medium text-text-muted whitespace-nowrap">
                  Chakra zoom
                </label>
                <input
                  type="range"
                  min={40}
                  max={200}
                  step={5}
                  value={Math.round(chakraZoom * 100)}
                  onChange={(e) => setChakraZoom(Number(e.target.value) / 100)}
                  className="w-40 min-w-[7rem] accent-primary"
                />
                <span className="w-12 tabular-nums text-xs text-text-muted text-center">
                  {Math.round(chakraZoom * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: context-specific */}
        {mode === "devta-marking" && (
          <DevtaInfoPanel
            selectedDevta={selectedDevta}
            onSelectDevta={setSelectedDevta}
          />
        )}
      </div>
    </div>
  );
}

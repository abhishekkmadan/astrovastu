"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LayoutMarker, MarkerKind, Verdict } from "@/types/database";
import { MARKER_TAXONOMY } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Trash2, MapPin, Check, X, Minus } from "lucide-react";

interface Props {
  layoutId: string;
  markers: LayoutMarker[];
  setMarkers: (m: LayoutMarker[]) => void;
}

const KINDS: MarkerKind[] = ["activity", "utility", "object"];
const VERDICT_OPTIONS: { value: Verdict; label: string; color: string }[] = [
  { value: "good", label: "Good", color: "text-success" },
  { value: "bad", label: "Bad", color: "text-danger" },
  { value: "neutral", label: "Neutral", color: "text-warning" },
];

export function MarkerPanel({ layoutId, markers, setMarkers }: Props) {
  const supabase = createClient();
  const [selectedKind, setSelectedKind] = useState<MarkerKind>("object");
  const [selectedLabel, setSelectedLabel] = useState(MARKER_TAXONOMY["object"][0]);
  const [placing, setPlacing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVerdict, setEditVerdict] = useState<Verdict>("neutral");
  const [editRemedy, setEditRemedy] = useState("");
  const [editNotes, setEditNotes] = useState("");

  async function handlePlaceMarker() {
    setPlacing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newMarker: LayoutMarker = {
      id: crypto.randomUUID(),
      layout_id: layoutId,
      user_id: user.id,
      kind: selectedKind,
      label: selectedLabel,
      position: { x: 0.5, y: 0.5 },
      verdict: "neutral",
      remedy: "",
      notes: "",
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("layout_markers").insert({
      id: newMarker.id,
      layout_id: layoutId,
      user_id: user.id,
      kind: selectedKind,
      label: selectedLabel,
      position: { x: 0.5, y: 0.5 },
      verdict: "neutral",
      remedy: "",
      notes: "",
    });

    if (!error) {
      setMarkers([...markers, newMarker]);
      setEditingId(newMarker.id);
      setEditVerdict("neutral");
      setEditRemedy("");
      setEditNotes("");
    }
    setPlacing(false);
  }

  function startEditing(m: LayoutMarker) {
    setEditingId(m.id);
    setEditVerdict(m.verdict);
    setEditRemedy(m.remedy);
    setEditNotes(m.notes);
  }

  async function saveMarkerEdit() {
    if (!editingId) return;
    await supabase
      .from("layout_markers")
      .update({ verdict: editVerdict, remedy: editRemedy, notes: editNotes })
      .eq("id", editingId);
    setMarkers(
      markers.map((m) =>
        m.id === editingId
          ? { ...m, verdict: editVerdict, remedy: editRemedy, notes: editNotes }
          : m
      )
    );
    setEditingId(null);
  }

  async function deleteMarker(id: string) {
    await supabase.from("layout_markers").delete().eq("id", id);
    setMarkers(markers.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-surface-border bg-surface flex flex-col">
      {/* Add marker controls */}
      <div className="border-b border-surface-border p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Add Marker
        </p>
        <div className="flex gap-1">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => {
                setSelectedKind(k);
                setSelectedLabel(MARKER_TAXONOMY[k][0]);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize ${
                selectedKind === k
                  ? "bg-accent text-white"
                  : "bg-surface-dim text-text-muted hover:bg-surface-border"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <select
          value={selectedLabel}
          onChange={(e) => setSelectedLabel(e.target.value)}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm"
        >
          {MARKER_TAXONOMY[selectedKind].map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={handlePlaceMarker}
          loading={placing}
          className="w-full"
        >
          <MapPin size={14} className="mr-1.5" />
          Place on Map
        </Button>
      </div>

      {/* Marker list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Markers ({markers.length})
        </p>
        {markers.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-3 text-sm ${
              editingId === m.id
                ? "border-accent bg-accent/5"
                : "border-surface-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] ${
                    m.verdict === "good"
                      ? "bg-success"
                      : m.verdict === "bad"
                      ? "bg-danger"
                      : "bg-warning"
                  }`}
                >
                  {m.verdict === "good" ? (
                    <Check size={10} />
                  ) : m.verdict === "bad" ? (
                    <X size={10} />
                  ) : (
                    <Minus size={10} />
                  )}
                </span>
                <span className="font-medium">{m.label}</span>
                <span className="text-[10px] text-text-muted capitalize">
                  {m.kind}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEditing(m)}
                  className="rounded p-1 text-text-muted hover:text-accent hover:bg-accent/10"
                >
                  ✎
                </button>
                <button
                  onClick={() => deleteMarker(m.id)}
                  className="rounded p-1 text-text-muted hover:text-danger hover:bg-danger/10"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {editingId === m.id && (
              <div className="mt-3 space-y-2 border-t border-surface-border pt-3">
                <div>
                  <label className="text-xs text-text-muted">Verdict</label>
                  <div className="mt-1 flex gap-1">
                    {VERDICT_OPTIONS.map((v) => (
                      <button
                        key={v.value}
                        onClick={() => setEditVerdict(v.value)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                          editVerdict === v.value
                            ? v.value === "good"
                              ? "bg-success text-white"
                              : v.value === "bad"
                              ? "bg-danger text-white"
                              : "bg-warning text-white"
                            : "bg-surface-dim text-text-muted"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted">Remedy</label>
                  <textarea
                    rows={2}
                    value={editRemedy}
                    onChange={(e) => setEditRemedy(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Suggested remedy..."
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveMarkerEdit}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {editingId !== m.id && m.remedy && (
              <p className="mt-1.5 text-xs text-text-muted">
                Remedy: {m.remedy}
              </p>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

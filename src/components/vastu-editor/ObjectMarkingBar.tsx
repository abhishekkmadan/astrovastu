"use client";

import { useMemo, useState } from "react";
import { MapPin, Save, Trash2, ChevronDown, Search, X } from "lucide-react";
import { OBJECT_CATALOG } from "@/lib/vastu/object-catalog";
import type { ZoneVerdict } from "@/lib/vastu/zone-verdicts";
import { zoneLabel } from "@/lib/vastu/zone-verdicts";
import type { MarkerSize, Point } from "@/types/database";

export interface PendingMarker {
  pos: Point;
  size: MarkerSize;
  itemKey: string;
  itemLabel: string;
  kind: "activity" | "utility" | "object";
  zoneIdx: number;
  verdict: ZoneVerdict;
}

interface Props {
  selectedItemKey: string | null;
  onSelect: (key: string | null) => void;
  pending: PendingMarker | null;
  onSave: (remedy: string) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

const HEADER_BG: Record<ZoneVerdict["verdict"], string> = {
  good: "bg-success",
  bad: "bg-danger",
  neutral: "bg-warning",
};

export function ObjectMarkingBar({
  selectedItemKey,
  onSelect,
  pending,
  onSave,
  onCancel,
  saving = false,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...OBJECT_CATALOG].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    if (!q) return sorted;
    return sorted.filter(
      (i) => i.label.toLowerCase().includes(q) || i.kind.toLowerCase().includes(q)
    );
  }, [query]);

  const selectedItem = selectedItemKey
    ? OBJECT_CATALOG.find((i) => i.key === selectedItemKey)
    : null;

  return (
    <>
      {/* Top dropdown bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[min(40rem,calc(100%-1.5rem))]">
        <div className="flex items-center gap-2 rounded-lg bg-surface border border-surface-border px-3 py-2 shadow-sm">
          <label className="text-xs font-medium text-text-muted whitespace-nowrap">
            Mark Object
          </label>
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-md border border-surface-border bg-surface px-2 py-1.5 text-sm hover:bg-surface-dim"
            >
              <span
                className={
                  selectedItem ? "text-text" : "text-text-muted"
                }
              >
                {selectedItem ? selectedItem.label : "Choose an item…"}
              </span>
              <div className="flex items-center gap-1">
                {selectedItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(null);
                      setQuery("");
                    }}
                    className="rounded p-0.5 text-text-muted hover:bg-surface-border"
                    aria-label="Clear selection"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className="text-text-muted" />
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-hidden rounded-md border border-surface-border bg-surface shadow-lg">
                <div className="flex items-center gap-2 border-b border-surface-border px-2 py-1.5">
                  <Search size={14} className="text-text-muted" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search items…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {filtered.length === 0 && (
                    <p className="px-3 py-2 text-xs text-text-muted">
                      No items match.
                    </p>
                  )}
                  {filtered.map((i) => (
                    <button
                      key={i.key}
                      onClick={() => {
                        onSelect(i.key);
                        setDropdownOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-surface-dim ${
                        selectedItemKey === i.key
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-text"
                      }`}
                    >
                      <span>{i.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">
                        {i.kind}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {selectedItem ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs text-accent whitespace-nowrap">
              <MapPin size={12} />
              Drag on map
            </span>
          ) : (
            <span className="text-xs text-text-muted whitespace-nowrap">
              Pick to begin
            </span>
          )}
        </div>
      </div>

      {/* Bottom verdict card (Photoshop-style colored title bar) */}
      {pending && (
        <PendingVerdictCard
          key={`${pending.itemKey}-${pending.pos.x}-${pending.pos.y}`}
          pending={pending}
          onSave={onSave}
          onCancel={onCancel}
          saving={saving}
        />
      )}
    </>
  );
}

function PendingVerdictCard({
  pending,
  onSave,
  onCancel,
  saving,
}: {
  pending: PendingMarker;
  onSave: (remedy: string) => Promise<void> | void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [remedy, setRemedy] = useState("");

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(48rem,calc(100%-1.5rem))] rounded-lg bg-surface border border-surface-border shadow-xl overflow-hidden">
      <div
        className={`flex items-center justify-between px-3 py-2 ${HEADER_BG[pending.verdict.verdict]}`}
      >
        <button
          onClick={onCancel}
          disabled={saving}
          title="Discard placement"
          className="rounded p-1 text-white/95 hover:bg-black/20 disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
        <h3 className="text-sm font-semibold text-white">
          {pending.itemLabel} in {zoneLabel(pending.zoneIdx)}
        </h3>
        <button
          onClick={() => onSave(remedy)}
          disabled={saving}
          title={saving ? "Saving…" : "Save placement"}
          className="rounded p-1 text-white/95 hover:bg-black/20 disabled:opacity-50"
        >
          <Save size={16} />
        </button>
      </div>
      <div className="bg-surface px-4 py-3 space-y-2">
        <p className="text-sm leading-relaxed text-text">
          {pending.verdict.explanation}
        </p>
        <textarea
          rows={2}
          value={remedy}
          onChange={(e) => setRemedy(e.target.value)}
          placeholder="Add a remedy or note (optional)…"
          className="w-full resize-none rounded-md border border-surface-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  );
}

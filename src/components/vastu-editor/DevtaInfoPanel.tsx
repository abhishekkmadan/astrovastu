"use client";

import { DEVTA_ZONES, getDevta } from "@/lib/vastu/devta-data";

interface Props {
  selectedDevta: number | null;
  onSelectDevta: (n: number | null) => void;
}

export function DevtaInfoPanel({ selectedDevta, onSelectDevta }: Props) {
  const zone = selectedDevta ? getDevta(selectedDevta) : null;

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-surface-border bg-surface flex flex-col">
      <div className="border-b border-surface-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Devta Marking
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Click on a numbered zone in the map to see devta details.
        </p>
      </div>

      {zone ? (
        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-accent bg-accent/5 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-accent">{zone.number}</span>
              <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent uppercase">
                {zone.code}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-text">{zone.title}</h3>
            <p className="mt-0.5 text-sm text-text-muted">{zone.deity}</p>
            <p className="mt-3 text-xs text-text-muted">
              Ring {zone.ring} &middot;{" "}
              {zone.startAngle.toFixed(1)}° – {zone.endAngle.toFixed(1)}°
            </p>
          </div>
          <button
            onClick={() => onSelectDevta(null)}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-xs text-text-muted hover:bg-surface-dim"
          >
            Deselect
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
              All 45 Devtas
            </p>
            {DEVTA_ZONES.map((z) => (
              <button
                key={z.number}
                onClick={() => onSelectDevta(z.number)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-dim transition-colors"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-danger/10 text-xs font-bold text-danger">
                  {z.number}
                </span>
                <span className="flex-1 truncate">
                  <span className="font-medium">{z.title}</span>
                  <span className="ml-1 text-text-muted text-xs">({z.deity})</span>
                </span>
                <span className="text-[10px] text-text-muted">{z.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

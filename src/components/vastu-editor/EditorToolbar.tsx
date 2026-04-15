"use client";

import type { EditorMode } from "./VastuEditorWrapper";

interface Props {
  mode: EditorMode;
  setMode: (m: EditorMode) => void;
  onClearBoundary: () => void;
}

const modes: { key: EditorMode; label: string }[] = [
  { key: "boundary", label: "EDIT BOUNDARY" },
  { key: "chakra", label: "CHAKRA" },
  { key: "mark-objects", label: "MARK OBJECTS" },
  { key: "view", label: "VIEW" },
];

export function EditorToolbar({ mode, setMode, onClearBoundary }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface p-1">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === m.key
              ? "bg-accent text-white"
              : "text-text-muted hover:bg-surface-dim"
          }`}
        >
          {m.label}
        </button>
      ))}
      {mode === "boundary" && (
        <button
          onClick={onClearBoundary}
          className="ml-2 rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
        >
          CLEAR
        </button>
      )}
    </div>
  );
}

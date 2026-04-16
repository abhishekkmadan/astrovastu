"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Layout, LayoutMarker } from "@/types/database";
import { VastuEditorWrapper } from "@/components/vastu-editor/VastuEditorWrapper";
import { Upload, ImageIcon } from "lucide-react";

const DEMO_USER = "00000000-0000-0000-0000-000000000001";

const initialMarkers: LayoutMarker[] = [];

/**
 * Test the editor without Supabase: http://localhost:3000/demo
 * Includes **Upload map** to use your own floor plan (preview in browser only).
 */
export default function DemoPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);
  const [mapUrl, setMapUrl] = useState("/demo-floorplan.svg");

  const layout: Layout = useMemo(
    () => ({
      id: "demo-layout",
      project_id: "demo",
      user_id: DEMO_USER,
      name: "Your map",
      image_path: mapUrl,
      image_url: mapUrl,
      boundary: [],
      center: { x: 0.5, y: 0.5 },
      north_degrees: 0,
      viewport: null,
      workspace_phase: "full",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [mapUrl]
  );

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.type.startsWith("image/")) return;
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    const url = URL.createObjectURL(f);
    blobRef.current = url;
    setMapUrl(url);
    e.target.value = "";
  }, []);

  const useSample = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    setMapUrl("/demo-floorplan.svg");
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-surface-dim">
      <div className="shrink-0 border-b border-surface-border bg-surface px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text">Demo — Vastu layout</h1>
            <p className="mt-0.5 text-sm text-text-muted">
              Upload your floor plan (map) image, then use the tools below. Nothing is
              saved to the cloud.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <Upload size={16} />
              Upload map
            </button>
            <button
              type="button"
              onClick={useSample}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-muted hover:bg-surface-dim"
            >
              <ImageIcon size={16} />
              Use sample plan
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <VastuEditorWrapper
          key={mapUrl}
          projectId="demo"
          layout={layout}
          markers={initialMarkers}
          demoMode
        />
      </div>
    </div>
  );
}

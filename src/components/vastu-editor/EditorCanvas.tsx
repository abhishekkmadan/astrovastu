"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Line,
  Circle,
  Group,
  Text,
  Rect,
} from "react-konva";
import type { Point, LayoutMarker, MarkerSize } from "@/types/database";
import type { EditorMode } from "./VastuEditorWrapper";
import type Konva from "konva";
import {
  ZONE_16_DIAGRAM_LABELS,
  ZONE_16_SUBLABELS,
  getDefaultEntranceLabel,
  entranceMidAngleDeg,
  zone16MidAngleDeg,
} from "@/lib/vastu/shakti-chakra";
import { DEVTA_ZONES } from "@/lib/vastu/devta-data";
import { devtaZonePolygon, polygonCentroid } from "@/lib/vastu/devta-geometry";

/** Clockwise degrees from North (0 = up) → canvas angle used elsewhere in this editor. */
function navDegToRad(nav: number) {
  return ((nav - 90) * Math.PI) / 180;
}

interface Props {
  imageUrl: string;
  mode: EditorMode;
  boundary: Point[];
  setBoundary: Dispatch<SetStateAction<Point[]>>;
  center: Point;
  setCenter: (c: Point) => void;
  northDegrees: number;
  /** Compass overlay scale (1 = default radius). */
  chakraZoom: number;
  markers: LayoutMarker[];
  /** Currently selected devta zone number (1-based), or null */
  selectedDevta?: number | null;
  /** Callback when user clicks a devta zone */
  onSelectDevta?: (devtaNumber: number | null) => void;
  /** When set in mark-objects mode, the cursor becomes a crosshair. */
  objectPlacingActive?: boolean;
  /**
   * Drag-to-select callback for mark-objects mode.
   * Returns the **center** of the selection and its **size** (normalized).
   */
  onMapSelect?: (center: Point, size: MarkerSize) => void;
  /** Rectangle for the currently pending (unsaved) marker, to render on top. */
  pendingRect?: { center: Point; size: MarkerSize; verdict: "good" | "bad" | "neutral" } | null;
}


const FLOOR_IMAGE_NAME = "floor-image";

function useImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = url;
  }, [url]);
  return image;
}

function stopNodeEvents(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  e.cancelBubble = true;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getBoundaryCentroid(points: Point[]): Point | null {
  if (points.length < 3) return null;

  let crossSum = 0;
  let xSum = 0;
  let ySum = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    crossSum += cross;
    xSum += (current.x + next.x) * cross;
    ySum += (current.y + next.y) * cross;
  }

  if (Math.abs(crossSum) < 1e-10) {
    const avg = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    return {
      x: clamp01(avg.x / points.length),
      y: clamp01(avg.y / points.length),
    };
  }

  return {
    x: clamp01(xSum / (3 * crossSum)),
    y: clamp01(ySum / (3 * crossSum)),
  };
}

export function EditorCanvas({
  imageUrl,
  mode,
  boundary,
  setBoundary,
  center,
  setCenter,
  northDegrees,
  chakraZoom,
  markers,
  selectedDevta,
  onSelectDevta,
  objectPlacingActive,
  onMapSelect,
  pendingRect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const image = useImage(imageUrl);

  const imgW = image?.naturalWidth ?? 1;
  const imgH = image?.naturalHeight ?? 1;

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!image) return;
    const scaleX = dims.w / imgW;
    const scaleY = dims.h / imgH;
    const s = Math.min(scaleX, scaleY) * 0.9;
    setScale(s);
    setOffset({
      x: (dims.w - imgW * s) / 2,
      y: (dims.h - imgH * s) / 2,
    });
  }, [image, dims, imgW, imgH]);

  const toCanvas = useCallback(
    (p: Point) => ({ x: p.x * imgW * scale + offset.x, y: p.y * imgH * scale + offset.y }),
    [imgW, imgH, scale, offset]
  );

  const toNormalized = useCallback(
    (x: number, y: number): Point => ({
      x: (x - offset.x) / (imgW * scale),
      y: (y - offset.y) / (imgH * scale),
    }),
    [imgW, imgH, scale, offset]
  );

  const imageRect = useCallback(() => {
    const left = offset.x;
    const top = offset.y;
    const w = imgW * scale;
    const h = imgH * scale;
    return { left, top, right: left + w, bottom: top + h, w, h };
  }, [offset, imgW, imgH, scale]);

  /** True if stage coordinates lie on the floor plan bitmap */
  const isInsideImage = useCallback(
    (sx: number, sy: number) => {
      const r = imageRect();
      return sx >= r.left && sx <= r.right && sy >= r.top && sy <= r.bottom;
    },
    [imageRect]
  );

  const clampToImageNorm = useCallback(
    (p: Point): Point => ({
      x: Math.max(0, Math.min(1, p.x)),
      y: Math.max(0, Math.min(1, p.y)),
    }),
    []
  );

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? scale * scaleBy : scale / scaleBy;
    setScale(Math.max(0.1, Math.min(5, newScale)));
  }

  // Drag-rectangle (marquee) state for Mark-Objects mode.
  const [dragRect, setDragRect] = useState<
    | { start: Point; current: Point } // both in canvas (pixel) coords
    | null
  >(null);

  const beginMarquee = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (mode !== "mark-objects" || !objectPlacingActive) return;

      const target = e.target;
      const cls = target.getClassName();
      // Only start a drag on the plan image / empty stage (ignore existing markers, etc.)
      if (cls !== "Image" && cls !== "Stage" && cls !== "Rect") return;

      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos || !isInsideImage(pos.x, pos.y)) return;

      setDragRect({ start: { x: pos.x, y: pos.y }, current: { x: pos.x, y: pos.y } });
    },
    [mode, objectPlacingActive, isInsideImage]
  );

  const updateMarquee = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!dragRect) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const r = imageRect();
      const clamped = {
        x: Math.max(r.left, Math.min(r.right, pos.x)),
        y: Math.max(r.top, Math.min(r.bottom, pos.y)),
      };
      setDragRect((prev) => (prev ? { ...prev, current: clamped } : prev));
    },
    [dragRect, imageRect]
  );

  const finishMarquee = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!dragRect) return;
      const { start, current } = dragRect;
      setDragRect(null);

      const x0 = Math.min(start.x, current.x);
      const y0 = Math.min(start.y, current.y);
      const x1 = Math.max(start.x, current.x);
      const y1 = Math.max(start.y, current.y);
      const pxW = x1 - x0;
      const pxH = y1 - y0;

      // Treat very small drags as a click: give the marker a default size.
      const MIN_PX = 6;
      const pxW2 = pxW < MIN_PX ? 32 : pxW;
      const pxH2 = pxH < MIN_PX ? 32 : pxH;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;

      const centerNorm = clampToImageNorm(toNormalized(cx, cy));
      const pxUnitX = imgW * scale;
      const pxUnitY = imgH * scale;
      const size: MarkerSize = {
        w: Math.max(0.01, pxW2 / Math.max(1, pxUnitX)),
        h: Math.max(0.01, pxH2 / Math.max(1, pxUnitY)),
      };
      onMapSelect?.(centerNorm, size);
    },
    [dragRect, clampToImageNorm, toNormalized, imgW, imgH, scale, onMapSelect]
  );

  /**
   * Click dispatcher for the stage — boundary mode only now.
   * (Mark-objects uses drag-to-select via begin/update/finish marquee.)
   */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (mode !== "boundary") return;

      const target = e.target;
      const cls = target.getClassName();

      if (cls === "Circle" || cls === "Group" || cls === "Text") return;
      if (cls === "Line") return;

      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      if (!isInsideImage(pos.x, pos.y)) return;
      if (cls !== "Image" && cls !== "Stage") return;

      const norm = clampToImageNorm(toNormalized(pos.x, pos.y));
      const nextBoundary = [...boundary, norm];
      setBoundary(nextBoundary);
      const centroid = getBoundaryCentroid(nextBoundary);
      if (centroid) setCenter(centroid);
    },
    [mode, boundary, setBoundary, setCenter, toNormalized, clampToImageNorm, isInsideImage]
  );

  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => {
      const r = imageRect();
      const pad = 4;
      return {
        x: Math.max(r.left + pad, Math.min(r.right - pad, pos.x)),
        y: Math.max(r.top + pad, Math.min(r.bottom - pad, pos.y)),
      };
    },
    [imageRect]
  );

  function handleBoundaryNodeDragEnd(idx: number, x: number, y: number) {
    const norm = clampToImageNorm(toNormalized(x, y));
    const next = [...boundary];
    next[idx] = norm;
    setBoundary(next);
    const centroid = getBoundaryCentroid(next);
    if (centroid) setCenter(centroid);
  }

  function handleNodeDoubleClick(e: Konva.KonvaEventObject<MouseEvent>, idx: number) {
    stopNodeEvents(e);
    if (mode !== "boundary") return;
    const nextBoundary = boundary.filter((_, i) => i !== idx);
    setBoundary(nextBoundary);
    const centroid = getBoundaryCentroid(nextBoundary);
    if (centroid) setCenter(centroid);
  }

  const centerCanvas = toCanvas(center);
  const minCanvasSide = Math.min(imgW * scale, imgH * scale);
  const chakraRadius = Math.min(minCanvasSide * 0.45 * chakraZoom, minCanvasSide * 0.5);

  const containerCursor =
    mode === "boundary"
      ? "crosshair"
      : mode === "mark-objects" && objectPlacingActive
        ? "crosshair"
        : "default";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{ cursor: containerCursor }}
    >
      {mode === "boundary" && (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-surface/95 px-4 py-2 text-center text-xs text-text-muted shadow-sm ring-1 ring-surface-border">
          Click on the plan to add corners (in order). Drag blue points to adjust.
          Double-click a point to remove. Scroll to zoom.
        </p>
      )}
      <Stage
        ref={stageRef}
        width={dims.w}
        height={dims.h}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={beginMarquee}
        onMouseMove={updateMarquee}
        onMouseUp={finishMarquee}
        onTouchStart={beginMarquee}
        onTouchMove={updateMarquee}
        onTouchEnd={finishMarquee}
      >
        <Layer>
          {image && (
            <KonvaImage
              name={FLOOR_IMAGE_NAME}
              image={image}
              x={offset.x}
              y={offset.y}
              width={imgW * scale}
              height={imgH * scale}
            />
          )}

          {boundary.length > 1 && (
            <Line
              listening={false}
              points={boundary.flatMap((p) => {
                const c = toCanvas(p);
                return [c.x, c.y];
              })}
              closed={boundary.length > 2}
              stroke="#e74c3c"
              strokeWidth={2}
              dash={mode === "boundary" ? [8, 4] : undefined}
            />
          )}

          {mode === "boundary" &&
            boundary.map((p, i) => {
              const c = toCanvas(p);
              return (
                <Circle
                  key={`boundary-v-${i}`}
                  name="boundary-node"
                  x={c.x}
                  y={c.y}
                  radius={8}
                  fill="#2980b9"
                  stroke="#fff"
                  strokeWidth={2}
                  draggable
                  dragBoundFunc={dragBoundFunc}
                  onMouseDown={stopNodeEvents}
                  onClick={stopNodeEvents}
                  onTap={stopNodeEvents}
                  onDragMove={(e) =>
                    handleBoundaryNodeDragEnd(i, e.target.x(), e.target.y())
                  }
                  onDragEnd={(e) =>
                    handleBoundaryNodeDragEnd(i, e.target.x(), e.target.y())
                  }
                  onDblClick={(e) => handleNodeDoubleClick(e, i)}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "grab";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "crosshair";
                  }}
                />
              );
            })}

          {boundary.length > 2 && (
            <Circle
              name="center-point"
              x={centerCanvas.x}
              y={centerCanvas.y}
              radius={7}
              fill="#e74c3c"
              stroke="#fff"
              strokeWidth={2}
              draggable={mode === "boundary" || mode === "chakra"}
              dragBoundFunc={dragBoundFunc}
              onMouseDown={stopNodeEvents}
              onClick={stopNodeEvents}
              onDragMove={(e) => {
                const norm = clampToImageNorm(
                  toNormalized(e.target.x(), e.target.y())
                );
                setCenter(norm);
              }}
              onDragEnd={(e) => {
                const norm = clampToImageNorm(
                  toNormalized(e.target.x(), e.target.y())
                );
                setCenter(norm);
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = "move";
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage)
                  stage.container().style.cursor =
                    mode === "boundary" ? "crosshair" : "default";
              }}
            />
          )}

          {mode === "chakra" && boundary.length > 2 && (
            <Group x={centerCanvas.x} y={centerCanvas.y} rotation={northDegrees} listening={false}>
              {(() => {
                const R = chakraRadius;
                const rFace = R * 0.99;
                const rDegInner = R * 0.9;
                const rDegLabel = R * 0.925;
                const rRingOuter = R * 0.88;
                const rRingMid = R * 0.72;
                const rPadLabel = R * 0.62;
                const rInnerDisk = R * 0.5;
                const ringStroke = "rgba(10,10,10,0.42)";
                /** Minor 1° ticks (non-10°) — lighter / thinner */
                const degMinorTick = "rgba(12,12,12,0.42)";
                const zoneLine = "rgba(8,8,8,0.82)";
                /** Match pada/spoke ink; single tone for every label */
                const chakraText = { fill: zoneLine };

                return (
                  <>
                    {/* Transparent overlay: rim only, floor plan shows through */}
                    <Circle
                      x={0}
                      y={0}
                      radius={rFace}
                      fill="transparent"
                      stroke={ringStroke}
                      strokeWidth={1}
                      listening={false}
                    />

                    {/* Zone structure: light rings (pada vs direction bands) */}
                    {[rRingOuter, rRingMid, rPadLabel, rInnerDisk].map((rr) => (
                      <Circle
                        key={`ring-${rr}`}
                        x={0}
                        y={0}
                        radius={rr}
                        stroke={ringStroke}
                        strokeWidth={0.85}
                        listening={false}
                      />
                    ))}

                    {/* Outer protractor: 1° ticks; every 10° longer + bold (same ink as zone lines); numerals every 10° below */}
                    {Array.from({ length: 360 }).map((_, d) => {
                      const rad = navDegToRad(d);
                      const every10 = d % 10 === 0;
                      const inset = every10 ? R * 0.014 : R * 0.032;
                      const r0 = rDegInner + inset;
                      const x1 = Math.cos(rad) * r0;
                      const y1 = Math.sin(rad) * r0;
                      const x2 = Math.cos(rad) * rFace;
                      const y2 = Math.sin(rad) * rFace;
                      return (
                        <Line
                          key={`deg-tick-${d}`}
                          points={[x1, y1, x2, y2]}
                          stroke={every10 ? zoneLine : degMinorTick}
                          strokeWidth={every10 ? Math.max(1.2, R * 0.0042) : 0.52}
                          listening={false}
                        />
                      );
                    })}

                    {/* 32 pada zone lines — primary guides so users can read zones on the plan */}
                    {Array.from({ length: 32 }).map((_, j) => {
                      const rad = navDegToRad(j * 11.25);
                      const x2 = Math.cos(rad) * rFace;
                      const y2 = Math.sin(rad) * rFace;
                      const solahEdge = j % 2 === 0;
                      return (
                        <Line
                          key={`spoke32-${j}`}
                          points={[0, 0, x2, y2]}
                          stroke={zoneLine}
                          strokeWidth={solahEdge ? Math.max(1.15, R * 0.0045) : Math.max(0.85, R * 0.003)}
                          listening={false}
                        />
                      );
                    })}

                    <Line
                      points={[0, 0, 0, -rFace]}
                      stroke="rgba(217,34,34,0.88)"
                      strokeWidth={Math.max(2, R * 0.009)}
                      listening={false}
                    />

                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350].map((deg) => {
                      const rad = navDegToRad(deg);
                      const tx = Math.cos(rad) * rDegLabel;
                      const ty = Math.sin(rad) * rDegLabel;
                      const label = deg === 0 ? "0" : String(deg);
                      const fsDeg = Math.max(11, R * 0.045);
                      return (
                        <Text
                          key={`deg-lbl-${deg}`}
                          x={tx}
                          y={ty}
                          text={label}
                          fontSize={fsDeg}
                          fontStyle="bold"
                          {...chakraText}
                          align="center"
                          verticalAlign="middle"
                          rotation={deg}
                          offsetX={label.length * (fsDeg * 0.35)}
                          offsetY={fsDeg * 0.38}
                          listening={false}
                        />
                      );
                    })}

                    {/* 16 major direction labels (tangential) */}
                    {ZONE_16_DIAGRAM_LABELS.map((dir, i) => {
                      const midDeg = zone16MidAngleDeg(i);
                      const mid = (midDeg * Math.PI) / 180;
                      const rLabel = R * 0.8;
                      const lx = Math.cos(mid) * rLabel;
                      const ly = Math.sin(mid) * rLabel;
                      const sub = ZONE_16_SUBLABELS[i]?.trim();
                      const fs = dir.length > 4 ? Math.max(10, R * 0.034) : Math.max(11, R * 0.038);
                      const wch = fs * 0.42;
                      return (
                        <Group key={`zlabel-${dir}`} listening={false}>
                          <Text
                            text={dir}
                            x={lx}
                            y={ly}
                            fontSize={fs}
                            fontStyle="bold"
                            {...chakraText}
                            align="center"
                            verticalAlign="middle"
                            rotation={midDeg + 90}
                            offsetX={dir.length * wch * 0.5}
                            offsetY={fs * 0.35}
                            listening={false}
                          />
                          {sub ? (
                            <Text
                              text={sub}
                              x={lx}
                              y={ly + fs * 0.9}
                              fontSize={fs * 0.62}
                              {...chakraText}
                              align="center"
                              verticalAlign="middle"
                              rotation={midDeg + 90}
                              offsetX={sub.length * wch * 0.31}
                              offsetY={fs * 0.35}
                              listening={false}
                            />
                          ) : null}
                        </Group>
                      );
                    })}

                    {/* 32 pada labels (bold, slightly inward of outer pada ring) */}
                    {Array.from({ length: 32 }).map((_, j) => {
                      const midDeg = entranceMidAngleDeg(j);
                      const mid = (midDeg * Math.PI) / 180;
                      const rEnt = R * 0.62;
                      const ex = Math.cos(mid) * rEnt;
                      const ey = Math.sin(mid) * rEnt;
                      const label = getDefaultEntranceLabel(j);
                      const fs = Math.max(11, R * 0.038);
                      return (
                        <Text
                          key={`ent-${j}`}
                          x={ex}
                          y={ey}
                          text={label}
                          fontSize={fs}
                          fontStyle="bold"
                          {...chakraText}
                          align="center"
                          verticalAlign="middle"
                          rotation={midDeg + 90}
                          offsetX={label.length * fs * 0.22}
                          offsetY={fs * 0.36}
                          listening={false}
                        />
                      );
                    })}

                    <Circle x={0} y={0} radius={Math.max(3, R * 0.014)} fill="#d92222" listening={false} />
                  </>
                );
              })()}
            </Group>
          )}

          {/* Devta marking overlay */}
          {mode === "devta-marking" && boundary.length > 2 && (() => {
            const rotatedBoundary = boundary.map((p) => {
              const dx = p.x - center.x;
              const dy = p.y - center.y;
              const rad = (northDegrees * Math.PI) / 180;
              return {
                x: center.x + dx * Math.cos(rad) + dy * Math.sin(rad),
                y: center.y - dx * Math.sin(rad) + dy * Math.cos(rad),
              };
            });

            return DEVTA_ZONES.map((zone) => {
              const normPts = devtaZonePolygon(zone, center, rotatedBoundary);
              if (normPts.length < 3) return null;

              const unrotatedPts = normPts.map((p) => {
                const dx = p.x - center.x;
                const dy = p.y - center.y;
                const rad = (-northDegrees * Math.PI) / 180;
                return {
                  x: center.x + dx * Math.cos(rad) + dy * Math.sin(rad),
                  y: center.y - dx * Math.sin(rad) + dy * Math.cos(rad),
                };
              });

              const canvasPts = unrotatedPts.map(toCanvas);
              const flatPts = canvasPts.flatMap((p) => [p.x, p.y]);

              const normCentroid = polygonCentroid(normPts);
              const unrotCentroid = (() => {
                const dx = normCentroid.x - center.x;
                const dy = normCentroid.y - center.y;
                const rad = (-northDegrees * Math.PI) / 180;
                return {
                  x: center.x + dx * Math.cos(rad) + dy * Math.sin(rad),
                  y: center.y - dx * Math.sin(rad) + dy * Math.cos(rad),
                };
              })();
              const labelPos = toCanvas(unrotCentroid);

              const isSelected = selectedDevta === zone.number;
              const fillColor = isSelected ? "rgba(41, 128, 185, 0.35)" : (zone.color + "80");
              const strokeColor = isSelected ? "#1a5276" : "#2980b9";

              return (
                <Group key={`devta-${zone.number}`}>
                  <Line
                    points={flatPts}
                    closed
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2 : 1}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      onSelectDevta?.(isSelected ? null : zone.number);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      onSelectDevta?.(isSelected ? null : zone.number);
                    }}
                    onMouseEnter={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = "pointer";
                    }}
                    onMouseLeave={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = "default";
                    }}
                  />
                  <Text
                    x={labelPos.x}
                    y={labelPos.y}
                    text={String(zone.number)}
                    fontSize={zone.ring === 0 ? 14 : 11}
                    fill={isSelected ? "#1a5276" : "#c0392b"}
                    fontStyle="bold"
                    align="center"
                    offsetX={zone.number >= 10 ? 7 : 4}
                    offsetY={6}
                    listening={false}
                  />
                </Group>
              );
            });
          })()}

          {/* Saved markers: rectangle (if size known) + center dot + label */}
          {markers.map((m) => {
            const pos = toCanvas(m.position);
            const color =
              m.verdict === "good"
                ? "#27ae60"
                : m.verdict === "bad"
                  ? "#e74c3c"
                  : "#f39c12";

            // Compute rectangle in canvas space if size present.
            const hasSize = !!m.size && m.size.w > 0 && m.size.h > 0;
            const wPx = hasSize ? m.size!.w * imgW * scale : 0;
            const hPx = hasSize ? m.size!.h * imgH * scale : 0;

            return (
              <Group
                key={m.id}
                onMouseDown={mode === "boundary" ? stopNodeEvents : undefined}
                onClick={mode === "boundary" ? stopNodeEvents : undefined}
              >
                {hasSize && (
                  <Rect
                    x={pos.x - wPx / 2}
                    y={pos.y - hPx / 2}
                    width={wPx}
                    height={hPx}
                    stroke={color}
                    strokeWidth={1.5}
                    dash={[6, 4]}
                    fill={`${color}1a`}
                    listening={false}
                  />
                )}
                <Circle
                  x={pos.x}
                  y={pos.y}
                  radius={6}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                  listening={false}
                />
                <Text
                  x={pos.x + (hasSize ? wPx / 2 + 6 : 14)}
                  y={pos.y - 6}
                  text={m.label}
                  fontSize={11}
                  fill="#1f2937"
                  fontStyle="bold"
                  listening={false}
                />
              </Group>
            );
          })}

          {/* Pending (unsaved) selection rectangle — from parent state */}
          {pendingRect && (() => {
            const pos = toCanvas(pendingRect.center);
            const color =
              pendingRect.verdict === "good"
                ? "#27ae60"
                : pendingRect.verdict === "bad"
                  ? "#e74c3c"
                  : "#f39c12";
            const wPx = pendingRect.size.w * imgW * scale;
            const hPx = pendingRect.size.h * imgH * scale;
            return (
              <Group listening={false}>
                <Rect
                  x={pos.x - wPx / 2}
                  y={pos.y - hPx / 2}
                  width={wPx}
                  height={hPx}
                  stroke={color}
                  strokeWidth={2}
                  dash={[8, 5]}
                  fill={`${color}22`}
                />
                <Circle
                  x={pos.x}
                  y={pos.y}
                  radius={6}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              </Group>
            );
          })()}

          {/* Live marquee while dragging (mark-objects mode) */}
          {dragRect && (() => {
            const x0 = Math.min(dragRect.start.x, dragRect.current.x);
            const y0 = Math.min(dragRect.start.y, dragRect.current.y);
            const w = Math.abs(dragRect.current.x - dragRect.start.x);
            const h = Math.abs(dragRect.current.y - dragRect.start.y);
            return (
              <Rect
                x={x0}
                y={y0}
                width={w}
                height={h}
                stroke="#e74c3c"
                strokeWidth={1.5}
                dash={[6, 4]}
                fill="rgba(231, 76, 60, 0.12)"
                listening={false}
              />
            );
          })()}
        </Layer>
      </Stage>
    </div>
  );
}

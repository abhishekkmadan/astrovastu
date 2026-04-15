"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle, Group, Text, Arrow } from "react-konva";
import type { Point, LayoutMarker } from "@/types/database";
import type { EditorMode } from "./VastuEditorWrapper";
import type Konva from "konva";

interface Props {
  imageUrl: string;
  mode: EditorMode;
  boundary: Point[];
  setBoundary: (b: Point[]) => void;
  center: Point;
  setCenter: (c: Point) => void;
  northDegrees: number;
  setNorthDegrees: (d: number) => void;
  markers: LayoutMarker[];
  setMarkers: (m: LayoutMarker[]) => void;
  layoutId: string;
}

const DIRECTION_16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

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

export function EditorCanvas({
  imageUrl,
  mode,
  boundary,
  setBoundary,
  center,
  setCenter,
  northDegrees,
  markers,
  setMarkers,
  layoutId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [draggingNodeIdx, setDraggingNodeIdx] = useState<number | null>(null);
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

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? scale * scaleBy : scale / scaleBy;
    setScale(Math.max(0.1, Math.min(5, newScale)));
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (mode !== "boundary") return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const norm = toNormalized(pos.x, pos.y);
    setBoundary([...boundary, norm]);
  }

  function handleNodeDrag(idx: number, x: number, y: number) {
    const norm = toNormalized(x, y);
    const newBoundary = [...boundary];
    newBoundary[idx] = norm;
    setBoundary(newBoundary);
  }

  function handleNodeDoubleClick(idx: number) {
    if (mode !== "boundary") return;
    const newBoundary = boundary.filter((_, i) => i !== idx);
    setBoundary(newBoundary);
  }

  const centerCanvas = toCanvas(center);
  const chakraRadius = Math.min(imgW * scale, imgH * scale) * 0.45;

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage
        ref={stageRef}
        width={dims.w}
        height={dims.h}
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Floor plan image */}
          {image && (
            <KonvaImage
              image={image}
              x={offset.x}
              y={offset.y}
              width={imgW * scale}
              height={imgH * scale}
            />
          )}

          {/* Boundary polygon */}
          {boundary.length > 1 && (
            <Line
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

          {/* Boundary nodes */}
          {mode === "boundary" &&
            boundary.map((p, i) => {
              const c = toCanvas(p);
              return (
                <Circle
                  key={`node-${i}`}
                  x={c.x}
                  y={c.y}
                  radius={6}
                  fill="#2980b9"
                  stroke="#fff"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) =>
                    handleNodeDrag(i, e.target.x(), e.target.y())
                  }
                  onDblClick={() => handleNodeDoubleClick(i)}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "pointer";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "default";
                  }}
                />
              );
            })}

          {/* Center point (always visible when boundary exists) */}
          {boundary.length > 2 && (
            <Circle
              x={centerCanvas.x}
              y={centerCanvas.y}
              radius={6}
              fill="#e74c3c"
              stroke="#fff"
              strokeWidth={2}
              draggable={mode === "boundary" || mode === "chakra"}
              onDragMove={(e) => {
                const norm = toNormalized(e.target.x(), e.target.y());
                setCenter(norm);
              }}
            />
          )}

          {/* Shakti Chakra overlay */}
          {mode === "chakra" && boundary.length > 2 && (
            <Group x={centerCanvas.x} y={centerCanvas.y} rotation={northDegrees}>
              {/* Direction lines + labels */}
              {DIRECTION_16.map((dir, i) => {
                const angle = (i * 22.5 - 90) * (Math.PI / 180);
                const x2 = Math.cos(angle) * chakraRadius;
                const y2 = Math.sin(angle) * chakraRadius;
                const labelX = Math.cos(angle) * (chakraRadius + 18);
                const labelY = Math.sin(angle) * (chakraRadius + 18);
                return (
                  <Group key={dir}>
                    <Line
                      points={[0, 0, x2, y2]}
                      stroke={i % 4 === 0 ? "#2980b9" : "#2980b980"}
                      strokeWidth={i % 4 === 0 ? 2 : 1}
                    />
                    <Text
                      text={dir}
                      x={labelX - 12}
                      y={labelY - 6}
                      fontSize={i % 4 === 0 ? 11 : 9}
                      fill={i % 4 === 0 ? "#2980b9" : "#6b7280"}
                      fontStyle={i % 4 === 0 ? "bold" : "normal"}
                    />
                  </Group>
                );
              })}
              {/* 32 entrance ticks */}
              {Array.from({ length: 32 }).map((_, i) => {
                const angle = (i * 11.25 - 90) * (Math.PI / 180);
                const innerR = chakraRadius * 0.92;
                const outerR = chakraRadius;
                return (
                  <Line
                    key={`tick-${i}`}
                    points={[
                      Math.cos(angle) * innerR,
                      Math.sin(angle) * innerR,
                      Math.cos(angle) * outerR,
                      Math.sin(angle) * outerR,
                    ]}
                    stroke="#e67e22"
                    strokeWidth={1.5}
                  />
                );
              })}
              {/* Concentric rings */}
              {[0.25, 0.5, 0.75, 1].map((r) => (
                <Circle
                  key={`ring-${r}`}
                  x={0}
                  y={0}
                  radius={chakraRadius * r}
                  stroke="#2980b940"
                  strokeWidth={1}
                />
              ))}
              {/* North arrow */}
              <Arrow
                points={[0, 0, 0, -chakraRadius * 0.35]}
                pointerLength={8}
                pointerWidth={6}
                fill="#e74c3c"
                stroke="#e74c3c"
                strokeWidth={2}
              />
              <Text
                text="N"
                x={-5}
                y={-chakraRadius * 0.35 - 18}
                fontSize={14}
                fill="#e74c3c"
                fontStyle="bold"
              />
            </Group>
          )}

          {/* Object markers */}
          {markers.map((m) => {
            const pos = toCanvas(m.position);
            const color =
              m.verdict === "good"
                ? "#27ae60"
                : m.verdict === "bad"
                ? "#e74c3c"
                : "#f39c12";
            return (
              <Group key={m.id} x={pos.x} y={pos.y}>
                <Circle radius={10} fill={color} stroke="#fff" strokeWidth={2} />
                <Text
                  text={m.label}
                  x={14}
                  y={-6}
                  fontSize={11}
                  fill="#1f2937"
                  fontStyle="bold"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

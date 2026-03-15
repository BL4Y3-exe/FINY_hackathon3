"use client";

import dynamic from "next/dynamic";
import { useRef, useCallback, useMemo } from "react";

// Dynamically import to avoid SSR issues (canvas-based)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
  id: string;
  name: string;
  image?: string | null;
  degree: number;
  isIsolated: boolean;
  role: string;
  skills: string[];
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface NetworkGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
}

const LINK_COLORS: Record<string, string> = {
  MATCH: "#8b5cf6",
  HELP: "#06b6d4",
  BUDDY: "#f59e0b",
  CHAT: "#10b981",
};

export function NetworkGraph({ nodes, links, width = 800, height = 500 }: NetworkGraphProps) {
  const graphRef = useRef<any>(null);

  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    }),
    [nodes, links],
  );

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name ?? node.id;
      const fontSize = Math.max(10, 14 / globalScale);
      const r = node.isIsolated ? 7 : Math.max(6, 5 + node.degree * 1.5);

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.isIsolated
        ? "#fca5a5"
        : node.role === "ADMIN"
        ? "#7c3aed"
        : "#8b5cf6";
      ctx.fill();

      if (node.isIsolated) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        label.length > 14 ? label.slice(0, 12) + "…" : label,
        node.x,
        node.y + r + fontSize * 0.8,
      );
    },
    [],
  );

  const linkDirectionalParticles = useCallback((link: any) => {
    return link.weight > 1 ? 2 : 0;
  }, []);

  const linkColor = useCallback((link: any) => {
    return LINK_COLORS[link.type as string] ?? "#9ca3af";
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        nodeLabel={(node: any) =>
          `${node.name}\nDegree: ${node.degree}\nSkills: ${(node.skills ?? []).join(", ") || "—"}`
        }
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => "replace"}
        linkColor={linkColor}
        linkWidth={(link: any) => Math.min(4, 0.5 + link.weight * 0.5)}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.006}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 40)}
        backgroundColor="#f9fafb"
      />
    </div>
  );
}

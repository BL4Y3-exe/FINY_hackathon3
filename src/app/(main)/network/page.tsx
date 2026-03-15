"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { NetworkGraph } from "@/components/NetworkGraph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Users, GitBranch, TrendingUp } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function NetworkPage() {
  const { data: memberships } = api.community.myMemberships.useQuery();
  const communityId = memberships?.[0]?.communityId ?? "";

  const { data: graphData, isLoading } = api.graph.networkData.useQuery(
    { communityId },
    { enabled: !!communityId },
  );
  const { data: health } = api.graph.healthScore.useQuery(
    { communityId },
    { enabled: !!communityId },
  );
  const { data: isolated } = api.graph.isolatedUsers.useQuery(
    { communityId },
    { enabled: !!communityId },
  );

  const [selectedLinkType, setSelectedLinkType] = useState<string | null>(null);

  const filteredLinks = graphData?.links.filter((l) =>
    selectedLinkType ? l.type === selectedLinkType : true,
  );

  const linkTypes = ["MATCH", "HELP", "BUDDY", "CHAT"] as const;
  const linkColors: Record<string, string> = {
    MATCH: "bg-violet-500",
    HELP: "bg-sky-500",
    BUDDY: "bg-amber-500",
    CHAT: "bg-emerald-500",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Community Network</h1>
        <p className="text-gray-500">
          Force-directed graph of relationships. Node size = connection degree.
        </p>
      </div>

      {/* Metrics bar */}
      {health && (
        <div className="grid gap-4 sm:grid-cols-4">
          <MetricCard label="Total Members" value={health.totalMembers} icon={Users} color="violet" />
          <MetricCard label="Active (7d)" value={health.activeUsers} icon={TrendingUp} color="emerald" />
          <MetricCard label="New Connections" value={health.newConnections} icon={GitBranch} color="sky" />
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-4 shadow-sm">
            <span className="text-sm text-gray-500">Health Score</span>
            <div className="my-2 relative flex h-12 w-12 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={health.score >= 70 ? "#10b981" : health.score >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="3"
                  strokeDasharray={`${health.score}, 100`}
                />
              </svg>
              <span className="absolute text-sm font-bold text-gray-900">{health.score}</span>
            </div>
            <span className="text-xs text-gray-400">out of 100</span>
          </div>
        </div>
      )}

      {/* Link type filter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Filter by type:</span>
        <button
          onClick={() => setSelectedLinkType(null)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${!selectedLinkType ? "border-gray-600 bg-gray-100 text-gray-800" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
        >
          All
        </button>
        {linkTypes.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedLinkType(selectedLinkType === t ? null : t)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selectedLinkType === t ? "border-gray-600 bg-gray-100 text-gray-800" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <span className={`h-2 w-2 rounded-full ${linkColors[t]}`} />
            {t}
          </button>
        ))}
      </div>

      {/* Graph */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border bg-gray-50">
          <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
        </div>
      ) : graphData && graphData.nodes.length > 0 ? (
        <NetworkGraph
          nodes={graphData.nodes}
          links={filteredLinks ?? graphData.links}
          width={typeof window !== "undefined" ? Math.min(window.innerWidth - 64, 1200) : 800}
          height={550}
        />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400">No network data yet. Start matching and helping!</p>
        </div>
      )}

      {/* Isolated users */}
      {isolated && isolated.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Isolated Members ({isolated.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-amber-700">
              These members have no connections yet. Consider initiating a match or welcoming them.
            </p>
            <div className="flex flex-wrap gap-2">
              {isolated.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm shadow-sm"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                    {getInitials(u.name ?? "?")}
                  </div>
                  <span className="text-gray-700">{u.name ?? "Anonymous"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  const colors: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600",
    emerald: "bg-emerald-100 text-emerald-600",
    sky: "bg-sky-100 text-sky-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className={`rounded-lg p-2 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

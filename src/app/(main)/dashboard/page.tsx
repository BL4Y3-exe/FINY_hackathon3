"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  HelpCircle,
  Network,
  Plus,
  TrendingUp,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: memberships, isLoading } = api.community.myMemberships.useQuery();
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

  const communityId = selectedCommunity ?? memberships?.[0]?.communityId ?? "";

  const { data: matchStats } = api.match.weeklyStats.useQuery(
    { communityId },
    { enabled: !!communityId },
  );
  const { data: helpRequests } = api.help.list.useQuery(
    { communityId, status: "OPEN" },
    { enabled: !!communityId },
  );
  const { data: healthData } = api.graph.healthScore.useQuery(
    { communityId },
    { enabled: !!communityId },
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!memberships || memberships.length === 0) {
    return (
      <div className="mx-auto max-w-lg pt-16 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
            <Network className="h-7 w-7 text-violet-600" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">You're not in any communities yet</h2>
        <p className="mb-6 text-gray-500">Create one or ask someone to invite you.</p>
        <CreateCommunityButton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-gray-500">Here's what's happening in your communities.</p>
        </div>
        <CreateCommunityButton />
      </div>

      {/* Community selector */}
      {memberships.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {memberships.map((m) => (
            <button
              key={m.communityId}
              onClick={() => setSelectedCommunity(m.communityId)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                (selectedCommunity ?? memberships[0].communityId) === m.communityId
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {m.community.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Community Members"
          value={memberships[0]?.community._count.memberships ?? 0}
          icon={Users}
          color="violet"
          description="total members"
        />
        <StatCard
          title="Matches This Week"
          value={matchStats?.total ?? 0}
          icon={Network}
          color="indigo"
          description={`${matchStats?.accepted ?? 0} accepted`}
        />
        <StatCard
          title="Open Help Requests"
          value={helpRequests?.length ?? 0}
          icon={HelpCircle}
          color="sky"
          description="need attention"
        />
        <StatCard
          title="Health Score"
          value={healthData?.score ?? communityId ? "—" : 0}
          icon={TrendingUp}
          color="emerald"
          description="community health"
          suffix="/100"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickActionCard
          title="Find a Peer"
          description="Let the AI match you with someone who complements your skills and goals."
          href="/match"
          icon={Users}
          color="bg-violet-500"
        />
        <QuickActionCard
          title="Post for Help"
          description="Stuck on something? Post it and get matched with the right expert."
          href="/help/new"
          icon={HelpCircle}
          color="bg-sky-500"
        />
        <QuickActionCard
          title="View Network"
          description="Explore the community relationship graph and spot isolated members."
          href="/network"
          icon={Network}
          color="bg-emerald-500"
        />
      </div>

      {/* Recent help requests */}
      {helpRequests && helpRequests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Help Requests</CardTitle>
              <Link href="/help">
                <Button variant="ghost" size="sm" className="gap-1 text-violet-600">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {helpRequests.slice(0, 4).map((req) => (
                <Link key={req.id} href={`/help/${req.id}`}>
                  <div className="flex items-start justify-between rounded-lg border border-gray-100 p-3 hover:border-gray-200 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{req.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        by {req.author.name ?? "Unknown"} · {formatRelativeDate(req.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {req.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  suffix = "",
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  description: string;
  suffix?: string;
}) {
  const colors: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600",
    indigo: "bg-indigo-100 text-indigo-600",
    sky: "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {value}
              {suffix && <span className="text-lg text-gray-400">{suffix}</span>}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{description}</p>
          </div>
          <div className={`rounded-xl p-3 ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full hover:border-violet-200 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="pt-5">
          <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function CreateCommunityButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const utils = api.useUtils();
  const create = api.community.create.useMutation({
    onSuccess: () => {
      utils.community.myMemberships.invalidate();
      setOpen(false);
      setName("");
    },
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
        <Plus className="h-4 w-4" /> Create Community
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length >= 2) create.mutate({ name: name.trim() });
      }}
      className="flex items-center gap-2"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Community name…"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
      />
      <Button
        type="submit"
        size="sm"
        disabled={create.isPending || name.trim().length < 2}
        className="bg-violet-600 hover:bg-violet-700"
      >
        {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}

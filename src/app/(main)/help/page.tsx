"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare, CheckCircle2, Clock, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { formatRelativeDate, getInitials } from "@/lib/utils";

const ALL_TAGS = [
  "React", "TypeScript", "Design", "Marketing", "Backend", "DevOps",
  "Python", "AI/ML", "Product", "Writing", "Sales",
];

export default function HelpBoardPage() {
  const { data: memberships } = api.community.myMemberships.useQuery();
  const communityId = memberships?.[0]?.communityId ?? "";

  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: requests, isLoading } = api.help.list.useQuery(
    { communityId, tags: filterTag ? [filterTag] : undefined },
    { enabled: !!communityId },
  );

  const filtered = requests?.filter((r) =>
    search.trim()
      ? r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      : true,
  );

  const statusColor: Record<string, "success" | "warning" | "info" | "secondary"> = {
    OPEN: "info",
    IN_PROGRESS: "warning",
    RESOLVED: "success",
    CLOSED: "secondary",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Board</h1>
          <p className="text-gray-500">Post problems, find experts, resolve together.</p>
        </div>
        <Link href="/help/new">
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4" /> Ask for Help
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search requests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterTag(null)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              !filterTag
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            All
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                filterTag === tag
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Link key={req.id} href={`/help/${req.id}`}>
              <Card className="hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{req.title}</h3>
                        <Badge variant={statusColor[req.status]}>
                          {req.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {req.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold">
                            {getInitials(req.author.name ?? "?")}
                          </div>
                          {req.author.name ?? "Anonymous"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(req.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {req._count.responses} responses
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">No help requests yet. Be the first to ask!</p>
        </div>
      )}
    </div>
  );
}

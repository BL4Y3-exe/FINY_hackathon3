"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Zap, Check, X, Loader2, Star } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function MatchPage() {
  const { data: memberships } = api.community.myMemberships.useQuery();
  const communityId = memberships?.[0]?.communityId ?? "";

  const { data: candidates, isLoading, refetch } = api.match.findPeers.useQuery(
    { communityId, limit: 5 },
    { enabled: !!communityId },
  );

  const { data: myMatches } = api.match.list.useQuery(
    { communityId },
    { enabled: !!communityId },
  );

  const requestMatch = api.match.requestMatch.useMutation({
    onSuccess: () => refetch(),
  });

  const acceptMatch = api.match.accept.useMutation({
    onSuccess: () => api.useUtils().match.list.invalidate(),
  });

  const rejectMatch = api.match.reject.useMutation({
    onSuccess: () => api.useUtils().match.list.invalidate(),
  });

  const { data: session } = useSession();

  if (!communityId) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Join a community first to find peers.
      </div>
    );
  }

  const pendingMatches = myMatches?.filter(
    (m) => m.status === "PENDING" && (m.userAId === session?.user?.id || m.userBId === session?.user?.id),
  ) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Your Peers</h1>
        <p className="text-gray-500">
          AI-powered matching based on your skills, interests, and goals.
        </p>
      </div>

      {/* Find matches button */}
      <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-violet-600">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Automatic Peer Matching</h2>
              <p className="mt-1 text-sm text-gray-600">
                The system scores every community member against your profile and surfaces your best
                matches right now.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Find Peers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates */}
      {candidates && candidates.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold text-gray-900">
            Top Matches for You
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <CandidateCard
                key={c.userId}
                candidate={c}
                communityId={communityId}
                onConnect={() =>
                  requestMatch.mutate({ targetUserId: c.userId, communityId })
                }
                isConnecting={requestMatch.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {candidates?.length === 0 && !isLoading && (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
          No new matches available right now. Come back after more members join, or expand your
          profile to get better results.
        </div>
      )}

      {/* Pending matches (incoming) */}
      {pendingMatches.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold text-gray-900">Pending Match Requests</h2>
          <div className="space-y-3">
            {pendingMatches.map((m) => {
              const other = m.userAId === session?.user?.id ? m.userB : m.userA;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={other.name ?? "?"} image={other.image} size="md" />
                    <div>
                      <p className="font-medium text-gray-900">{other.name ?? "Anonymous"}</p>
                      <p className="text-xs text-gray-400">Wants to connect</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptMatch.mutate({ matchId: m.id })}
                      disabled={acceptMatch.isPending}
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="h-3 w-3" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMatch.mutate({ matchId: m.id })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted matches */}
      {myMatches && myMatches.filter((m) => m.status === "ACCEPTED").length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold text-gray-900">Your Connections</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {myMatches
              .filter((m) => m.status === "ACCEPTED")
              .map((m) => {
                const other = m.userAId === session?.user?.id ? m.userB : m.userA;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <Avatar name={other.name ?? "?"} image={other.image} size="md" />
                    <div>
                      <p className="font-medium text-gray-900">{other.name ?? "Anonymous"}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(other.profile?.skills ?? []).slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  communityId,
  onConnect,
  isConnecting,
}: {
  candidate: { userId: string; name: string | null; image: string | null; score: number; sharedInterests: string[]; complementarySkills: string[] };
  communityId: string;
  onConnect: () => void;
  isConnecting: boolean;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="flex flex-1 flex-col gap-4 pt-5">
        <div className="flex items-center gap-3">
          <Avatar name={candidate.name ?? "?"} image={candidate.image} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{candidate.name ?? "Anonymous"}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-gray-500">
                Score: {candidate.score.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {candidate.sharedInterests.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase text-gray-400">Shared Interests</p>
            <div className="flex flex-wrap gap-1">
              {candidate.sharedInterests.map((i) => (
                <Badge key={i} variant="info" className="text-xs">
                  {i}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {candidate.complementarySkills.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase text-gray-400">
              Their Skills You Lack
            </p>
            <div className="flex flex-wrap gap-1">
              {candidate.complementarySkills.slice(0, 4).map((s) => (
                <Badge key={s} variant="success" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={onConnect}
          disabled={isConnecting}
          size="sm"
          className="mt-auto gap-2 bg-violet-600 hover:bg-violet-700"
        >
          {isConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
          Connect
        </Button>
      </CardContent>
    </Card>
  );
}

function Avatar({
  name,
  image,
  size = "md",
}: {
  name: string;
  image: string | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };
  return image ? (
    <img
      src={image}
      alt={name}
      className={`${sizes[size]} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${sizes[size]} flex flex-shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700`}
    >
      {getInitials(name)}
    </div>
  );
}

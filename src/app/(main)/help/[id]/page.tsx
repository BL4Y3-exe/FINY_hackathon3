"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { formatRelativeDate, getInitials } from "@/lib/utils";
import Link from "next/link";

export default function HelpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const requestId = params.id as string;

  const { data: request, refetch } = api.help.get.useQuery({ id: requestId });
  const { data: experts } = api.help.getExperts.useQuery({ requestId }, { enabled: !!requestId });

  const [reply, setReply] = useState("");
  const respond = api.help.respond.useMutation({
    onSuccess: () => {
      setReply("");
      refetch();
    },
  });

  const resolve = api.help.resolve.useMutation({
    onSuccess: () => refetch(),
  });

  if (!request) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
      </div>
    );
  }

  const isAuthor = session?.user?.id === request.authorId;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Help Board
      </button>

      {/* Request header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <div className="flex gap-2">
            {isAuthor && request.status !== "RESOLVED" && (
              <Button
                size="sm"
                onClick={() => resolve.mutate({ requestId })}
                disabled={resolve.isPending}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Badge variant={request.status === "RESOLVED" ? "success" : request.status === "IN_PROGRESS" ? "warning" : "info"}>
            {request.status}
          </Badge>
          <span className="text-sm text-gray-400">
            by {request.author.name ?? "Anonymous"} · {formatRelativeDate(request.createdAt)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {request.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="pt-5">
          <p className="whitespace-pre-wrap text-gray-700">{request.description}</p>
        </CardContent>
      </Card>

      {/* Matched experts */}
      {experts && experts.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold text-gray-900">Suggested Experts</h2>
          <div className="flex flex-wrap gap-2">
            {experts.map((e) => (
              <div
                key={e.userId}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                  {getInitials(e.name ?? "?")}
                </div>
                <span className="font-medium text-gray-700">{e.name}</span>
                <div className="flex gap-1">
                  {e.matchingSkills.slice(0, 2).map((s) => (
                    <Badge key={s} variant="info" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responses */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <MessageSquare className="h-4 w-4" />
          {request.responses.length} Response{request.responses.length !== 1 ? "s" : ""}
        </h2>
        <div className="space-y-4">
          {request.responses.map((res) => (
            <div key={res.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {res.helper.image ? (
                  <img
                    src={res.helper.image}
                    alt={res.helper.name ?? ""}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                    {getInitials(res.helper.name ?? "?")}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{res.helper.name ?? "Anonymous"}</span>
                  <span className="text-xs text-gray-400">{formatRelativeDate(res.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{res.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply form */}
      {request.status !== "RESOLVED" && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <h3 className="font-medium text-gray-900">Post a response</h3>
            <Textarea
              placeholder="Share your knowledge or experience…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
            />
            <Button
              onClick={() => respond.mutate({ requestId, message: reply.trim() })}
              disabled={respond.isPending || reply.trim().length < 5}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {respond.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              Submit Response
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

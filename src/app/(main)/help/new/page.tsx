"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, HelpCircle } from "lucide-react";

const SUGGESTED_TAGS = [
  "React", "TypeScript", "Design", "Marketing", "Backend", "DevOps",
  "Python", "AI/ML", "Product", "Writing", "Sales", "Data", "Mobile",
];

export default function NewHelpRequestPage() {
  const router = useRouter();
  const { data: memberships } = api.community.myMemberships.useQuery();
  const communityId = memberships?.[0]?.communityId ?? "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const create = api.help.create.useMutation({
    onSuccess: (data) => router.push(`/help/${data.id}`),
    onError: (e) => setError(e.message),
  });

  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!communityId) return setError("Join a community first.");
    if (title.trim().length < 5) return setError("Title must be at least 5 characters.");
    if (description.trim().length < 10) return setError("Description must be at least 10 characters.");
    if (tags.length === 0) return setError("Add at least one tag.");

    create.mutate({
      communityId,
      title: title.trim(),
      description: description.trim(),
      tags,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ask for Help</h1>
        <p className="text-gray-500">
          Describe your problem and we'll match you with the right experts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-violet-600" />
            <CardTitle>New Help Request</CardTitle>
          </div>
          <CardDescription>
            Be specific — the more detail you provide, the better your expert matches will be.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. React state management — getting stale closures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
              <p className="mt-1 text-right text-xs text-gray-400">{title.length}/120</p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe what you're trying to do, what you've tried, and where you're stuck…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
              />
              <p className="mt-1 text-right text-xs text-gray-400">{description.length}/2000</p>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Tags <span className="text-red-500">*</span>
              </label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="default" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a tag and press Enter…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addTag(tagInput)}>
                  Add
                </Button>
              </div>
              {/* Suggested tags */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600 hover:border-violet-400 hover:text-violet-700"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={create.isPending}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <HelpCircle className="h-4 w-4" />
                )}
                Post Request
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

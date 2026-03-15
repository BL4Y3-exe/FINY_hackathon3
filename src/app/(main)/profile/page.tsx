"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, X, User } from "lucide-react";
import { getInitials } from "@/lib/utils";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Europe/Paris",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: user, refetch } = api.profile.me.useQuery();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [saved, setSaved] = useState(false);

  // Initialise form from loaded data
  useState(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.profile?.bio ?? "");
      setGoals(user.profile?.goals ?? "");
      setTimezone(user.profile?.timezone ?? "UTC");
      setSkills(user.profile?.skills ?? []);
      setInterests(user.profile?.interests ?? []);
    }
  });

  const upsert = api.profile.upsert.useMutation({
    onSuccess: () => {
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function addChip(
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    setInput: (v: string) => void,
  ) {
    const v = value.trim();
    if (v && !list.map((x) => x.toLowerCase()).includes(v.toLowerCase()) && list.length < 20) {
      setList([...list, v]);
    }
    setInput("");
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    upsert.mutate({ name, bio, goals, timezone, skills, interests });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-500">
          The more you fill in, the better the matchmaking and expert-matching become.
        </p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700">
                {session?.user?.name ? getInitials(session.user.name) : <User className="h-7 w-7" />}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{session?.user?.name ?? "—"}</p>
              <p className="text-sm text-gray-400">{session?.user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={80}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself…"
                rows={3}
                maxLength={500}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Goals</label>
              <Textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What are you trying to achieve in this community?"
                rows={2}
                maxLength={500}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Badge key={s} variant="default" className="gap-1 pr-1">
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g. React)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChip(skills, setSkills, skillInput, setSkillInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addChip(skills, setSkills, skillInput, setSkillInput)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {interests.map((i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {i}
                  <button
                    type="button"
                    onClick={() => setInterests(interests.filter((x) => x !== i))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest (e.g. open source)"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChip(interests, setInterests, interestInput, setInterestInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addChip(interests, setInterests, interestInput, setInterestInput)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={upsert.isPending}
          className={`gap-2 ${saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-violet-600 hover:bg-violet-700"}`}
        >
          {upsert.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}

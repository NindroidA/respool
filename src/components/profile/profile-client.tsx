"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";
import {
  Loader2,
  Disc,
  Layers3,
  Weight,
  Calendar,
  Shield,
  Mail,
  Save,
} from "lucide-react";
import { TwoFactorSetup } from "./two-factor-setup";

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    createdAt: Date;
    twoFactorEnabled: boolean;
  };
  stats: {
    totalSpools: number;
    totalPrints: number;
    totalFilamentUsed: number;
  };
  providers: string[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function providerIcon(provider: string) {
  switch (provider) {
    case "github":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    case "google":
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    default:
      return <Mail className="h-4 w-4" />;
  }
}

function providerLabel(provider: string) {
  switch (provider) {
    case "github":
      return "GitHub";
    case "google":
      return "Google";
    case "credential":
      return "Email & Password";
    default:
      return provider;
  }
}

export function ProfileClient({ user, stats, providers }: ProfileClientProps) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasChanges = name !== user.name;

  async function handleSave() {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await updateProfile({ name });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar + Name Card */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-teal-500/5 p-6 ring-1 ring-primary/5">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-start gap-5">
          <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-lg shadow-primary/10">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-(--accent-jade-muted) text-xl font-bold text-jade">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {user.name}
                </h2>
                {user.role === "admin" && (
                  <Badge className="border-primary/30 bg-primary/10 text-primary">
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Member since {formatDate(user.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/10 to-transparent p-4 text-center ring-1 ring-primary/5">
          <Disc className="mx-auto mb-1.5 h-4 w-4 text-primary" />
          <p className="font-mono text-xl font-bold text-primary">
            {stats.totalSpools}
          </p>
          <p className="text-2xs font-medium uppercase tracking-wider text-(--text-faint)">
            spools
          </p>
        </div>
        <div className="rounded-xl border border-teal-500/20 bg-linear-to-br from-teal-500/10 to-transparent p-4 text-center ring-1 ring-teal-500/5">
          <Layers3 className="mx-auto mb-1.5 h-4 w-4 text-teal-400" />
          <p className="font-mono text-xl font-bold text-teal-400">
            {stats.totalPrints}
          </p>
          <p className="text-2xs font-medium uppercase tracking-wider text-(--text-faint)">
            prints
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 to-transparent p-4 text-center ring-1 ring-amber-500/5">
          <Weight className="mx-auto mb-1.5 h-4 w-4 text-amber-400" />
          <p className="font-mono text-xl font-bold text-amber-400">
            {stats.totalFilamentUsed}g
          </p>
          <p className="text-2xs font-medium uppercase tracking-wider text-(--text-faint)">
            filament used
          </p>
        </div>
      </div>

      {/* Edit Name */}
      <div className="rounded-xl border border-border bg-card p-6 ring-1 ring-primary/5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Edit Profile
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Display Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled />
            <p className="text-2xs text-(--text-faint)">
              Email cannot be changed
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="rounded-xl border border-border bg-card p-6 ring-1 ring-primary/5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Connected Accounts
        </h3>

        <div className="space-y-2">
          {providers.map((provider) => (
            <div
              key={provider}
              className="flex items-center gap-3 rounded-lg border border-border bg-(--bg-card) p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-jade-muted) text-jade">
                {providerIcon(provider)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {providerLabel(provider)}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-xs text-primary"
              >
                Connected
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border bg-card p-6 ring-1 ring-primary/5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Security
        </h3>

        <TwoFactorSetup enabled={user.twoFactorEnabled} />
      </div>
    </div>
  );
}

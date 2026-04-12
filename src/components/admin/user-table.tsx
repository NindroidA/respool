"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActions } from "./user-actions";
import { Shield, Mail } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  createdAt: Date;
  lastAccessed: Date | null;
  providers: string[];
  sessionCount: number;
}

interface UserTableProps {
  users: UserData[];
  currentUserId: string;
}

function formatDate(date: Date | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString();
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github")
    return <span className="text-2xs font-bold">GH</span>;
  if (provider === "google")
    return <span className="text-2xs font-bold">G</span>;
  return <Mail className="h-3.5 w-3.5" />;
}

export function UserTable({ users, currentUserId }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead className="text-right">Sessions</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const initials = user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="bg-(--accent-jade-muted) text-2xs text-jade">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user.name}
                      {user.banned && (
                        <span className="ml-1.5 text-xs text-(--color-error)">
                          (banned)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  {user.providers.map((p) => (
                    <div
                      key={p}
                      className="flex h-6 w-6 items-center justify-center rounded bg-(--bg-card-hover) text-muted-foreground"
                      title={p}
                    >
                      <ProviderIcon provider={p} />
                    </div>
                  ))}
                  {user.providers.length === 0 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-(--bg-card-hover) text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {user.role === "admin" ? (
                  <Badge
                    variant="outline"
                    className="border-transparent bg-(--accent-jade-muted) text-xs font-semibold text-jade"
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    User
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatDate(user.lastAccessed)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                {user.sessionCount}
              </TableCell>
              <TableCell>
                {user.id !== currentUserId && <UserActions user={user} />}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

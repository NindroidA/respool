"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StyledSelect } from "@/components/ui/styled-select";
import { toggleUserRole, toggleUserBan, deleteUser } from "@/app/(dashboard)/admin/actions";
import { getEnhancedUsers } from "@/app/(dashboard)/admin/users/actions";
import { toast } from "sonner";
import {
  Search,
  Shield,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastAccessed: Date | null;
  spoolCount: number;
  printCount: number;
  sessionCount: number;
}

interface EnhancedUserTableProps {
  initialData: {
    users: UserRow[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export function EnhancedUserTable({ initialData }: EnhancedUserTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  async function fetchUsers(page = 1) {
    setLoading(true);
    try {
      const result = await getEnhancedUsers({
        search: search || undefined,
        role: roleFilter,
        status: statusFilter,
        page,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    action: () => Promise<void>,
    successMsg: string,
  ) {
    try {
      await action();
      toast.success(successMsg);
      fetchUsers(data.page);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--text-faint)" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
        <StyledSelect
          value={roleFilter}
          onChange={(val) => { setRoleFilter(val); }}
          options={[
            { value: "all", label: "All Roles" },
            { value: "admin", label: "Admin" },
            { value: "user", label: "User" },
          ]}
          className="w-32"
          size="sm"
        />
        <StyledSelect
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); }}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "banned", label: "Banned" },
          ]}
          className="w-32"
          size="sm"
        />
        <Button size="sm" onClick={() => fetchUsers(1)}>
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-(--text-faint)">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">2FA</th>
              <th className="px-4 py-3">Spools</th>
              <th className="px-4 py-3">Prints</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={loading ? "opacity-50" : ""}>
            {data.users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-(--text-muted)">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      user.role === "admin"
                        ? "border-jade/30 text-jade"
                        : "text-(--text-muted)"
                    }
                  >
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.twoFactorEnabled
                        ? "text-jade"
                        : "text-(--text-faint)"
                    }
                  >
                    {user.twoFactorEnabled ? "On" : "Off"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{user.spoolCount}</td>
                <td className="px-4 py-3 font-mono">{user.printCount}</td>
                <td className="px-4 py-3 text-xs text-(--text-muted)">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Toggle role"
                      onClick={() =>
                        handleAction(
                          () => toggleUserRole(user.id),
                          "Role updated",
                        )
                      }
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 ${user.banned ? "text-(--color-warning)" : ""}`}
                      title={user.banned ? "Unban" : "Ban"}
                      onClick={() =>
                        handleAction(
                          () => toggleUserBan(user.id),
                          user.banned ? "User unbanned" : "User banned",
                        )
                      }
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-(--color-error)"
                      title="Delete user"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete ${user.name}? This cannot be undone.`,
                          )
                        ) {
                          handleAction(
                            () => deleteUser(user.id),
                            "User deleted",
                          );
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-(--text-muted)">
        <span>
          Showing {(data.page - 1) * data.perPage + 1}–
          {Math.min(data.page * data.perPage, data.total)} of {data.total}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={data.page <= 1}
            onClick={() => fetchUsers(data.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={data.page >= data.totalPages}
            onClick={() => fetchUsers(data.page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

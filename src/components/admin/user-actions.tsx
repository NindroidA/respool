"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleUserRole, toggleUserBan, deleteUser } from "@/app/(dashboard)/admin/actions";
import { toast } from "sonner";
import { MoreHorizontal, Shield, ShieldOff, Ban, UserCheck, Trash2 } from "lucide-react";

interface UserActionsProps {
  user: {
    id: string;
    name: string;
    role: string;
    banned: boolean;
  };
}

export function UserActions({ user }: UserActionsProps) {
  async function handleRoleToggle() {
    try {
      await toggleUserRole(user.id);
      toast.success(
        user.role === "admin"
          ? `${user.name} is now a regular user`
          : `${user.name} is now an admin`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleBanToggle() {
    try {
      await toggleUserBan(user.id);
      toast.success(
        user.banned
          ? `${user.name} has been unbanned`
          : `${user.name} has been banned`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete ${user.name}? All their data will be lost.`)) return;
    try {
      await deleteUser(user.id);
      toast.success(`${user.name} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded p-1 text-muted-foreground transition-colors hover:bg-(--bg-card-hover)">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleRoleToggle}>
          {user.role === "admin" ? (
            <>
              <ShieldOff className="mr-2 h-4 w-4" />
              Remove Admin
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Make Admin
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleBanToggle}>
          {user.banned ? (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Unban
            </>
          ) : (
            <>
              <Ban className="mr-2 h-4 w-4" />
              Ban
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive-foreground">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

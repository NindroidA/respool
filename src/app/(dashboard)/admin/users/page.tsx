import { getAdminUsers } from "./actions";
import { AdminUserTable } from "@/components/admin/admin-user-table";

export default async function AdminUsersPage() {
  const data = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">User Management</h2>
        <p className="text-sm text-muted-foreground">
          Search, filter, and manage all users.
        </p>
      </div>

      <AdminUserTable initialData={data} />
    </div>
  );
}

import { getAuditLogs } from "./actions";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";

export default async function AuditLogPage() {
  const data = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Comprehensive activity trail for all actions.
        </p>
      </div>

      <AuditLogViewer initialData={data} />
    </div>
  );
}

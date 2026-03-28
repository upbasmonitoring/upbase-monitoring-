import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import DeleteConfirmationDialog from "@/components/modals/DeleteConfirmationDialog";
import AIInsightButton from "./AIInsightButton";

const RecentLogsTable = ({ logs, onRefresh }: { logs?: any[], onRefresh?: () => void }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/monitors/activity/${id}`, { method: 'DELETE' });
      toast.success("Activity log deleted");
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openDeleteDialog = (id: string) => {
    setLogToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border/50 pb-2">
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium">Monitor</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {logs?.map((log) => (
              <tr key={log._id} className="group hover:bg-muted/10 transition-colors">
                <td className="py-3 text-muted-foreground font-mono text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="py-3">
                  <p className="font-medium max-w-[150px] truncate">{log.monitor?.name || 'Deleted'}</p>
                </td>
                <td className="py-3">
                  <Badge variant={log.status === "online" ? "secondary" : "destructive"} className="text-[10px] h-4">
                    {log.status === "online" ? "SUCCESS" : "FAIL"}
                  </Badge>
                </td>
                <td className="py-3 text-right flex items-center justify-end gap-2">
                  <AIInsightButton log={log} />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openDeleteDialog(log._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground italic">
                  No recent activity found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => logToDelete && handleDelete(logToDelete)}
        title="Delete Activity Log"
        description="Are you sure you want to delete this activity log from your records?"
      />
    </div>
  );
};

export default RecentLogsTable;

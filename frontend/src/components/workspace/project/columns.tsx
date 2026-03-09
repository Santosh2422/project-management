// src/components/workspace/project/columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { TaskType } from "@/types/api.type"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils";

export const columns: ColumnDef<TaskType>[] = [
  {
    accessorKey: "title",
    header: "Task Name",
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.getValue("title")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline" className="capitalize">{status.replace("_", " ")}</Badge>;
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded",
          priority === "HIGH" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"
        )}>
          {priority}
        </span>
      );
    },
  },
]
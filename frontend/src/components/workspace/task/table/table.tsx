
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  ColumnDef,
  VisibilityState,
  OnChangeFn,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LayoutList, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableSkeleton from '@/components/skeleton-loaders/table-skeleton';
import { DataTablePagination } from './table-pagination';
import { useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSectionMutationFn, deleteSectionMutationFn } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import useWorkspaceId from '@/hooks/use-workspace-id';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  isLoading?: boolean;
  pagination: {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowClick?: (row: TData) => void;
  onAddTaskClick?: (sectionId: string) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
}

// ─── Section Header Actions Component ───────────────────────────────────────
function SectionHeaderActions({
  sectionId,
  sectionName,
  projectId,
}: {
  sectionId: string;
  sectionName: string;
  projectId?: string;
}) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(sectionName);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateSection, isPending: isUpdating } = useMutation({
    mutationFn: updateSectionMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections'] });
      toast({ title: 'Section renamed', variant: 'success' });
      setIsRenaming(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const { mutate: deleteSection, isPending: isDeleting } = useMutation({
    mutationFn: deleteSectionMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      toast({ title: 'Section deleted', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleRenameSubmit = () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === sectionName) {
      setIsRenaming(false);
      setNewName(sectionName);
      return;
    }
    if (!projectId || !workspaceId) return;
    updateSection({ workspaceId, projectId, sectionId, name: trimmed });
  };

  if (isRenaming) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleRenameSubmit();
        }}
      >
        <Input
          ref={inputRef}
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-7 text-sm w-40 font-semibold"
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsRenaming(false);
              setNewName(sectionName);
            }
          }}
          disabled={isUpdating}
        />
      </form>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteAlert(true);
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete section "{sectionName}"?</DialogTitle>
            <DialogDescription>
              This will permanently delete the section and all its tasks (including subtasks). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAlert(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!projectId || !workspaceId) return;
                deleteSection({ workspaceId, projectId, sectionId });
                setShowDeleteAlert(false);
              }}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main DataTable ──────────────────────────────────────────────────────────
export function DataTable<TData>({
  data,
  columns,
  isLoading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onAddTaskClick,
  columnVisibility = {},
  onColumnVisibilityChange,
}: DataTableProps<TData>) {

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row: any) => row.subtasks,
  });

  const { totalCount, pageNumber, pageSize } = pagination;
  const columnsCount = columns.length;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card shadow-sm">
        {isLoading ? (
          <TableSkeleton columns={columnsCount} rows={pageSize} />
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-bold uppercase">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const rowData = row.original as any;

                  // Section header row
                  if (rowData.isHeader) {
                    return (
                      <TableRow
                        key={row.id}
                        className="bg-muted/30 hover:bg-muted/40 border-y border-border/60 group"
                      >
                        <TableCell colSpan={columnsCount} className="py-2 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LayoutList className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                              <span className="font-bold text-[11px] uppercase tracking-widest text-foreground/60">
                                {rowData.name}
                              </span>
                              {/* Rename / Delete actions */}
                              <SectionHeaderActions
                                sectionId={rowData._id}
                                sectionName={rowData.name}
                                projectId={rowData.project}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddTaskClick?.(rowData._id);
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" /> Add Task
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // Standard task row
                  return (
                    <TableRow
                      key={row.id}
                      className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                      onClick={() => onRowClick && onRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columnsCount} className="h-24 text-center text-muted-foreground">
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <DataTablePagination
        table={table}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
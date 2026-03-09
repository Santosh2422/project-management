
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
import { LayoutList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableSkeleton from '@/components/skeleton-loaders/table-skeleton';
import { DataTablePagination } from './table-pagination';

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
  // Lifted from parent so the toolbar dropdown and DataTable stay in sync
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
}

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

                  // --- 2. RENDER SECTION HEADER ROW ---
                  if (rowData.isHeader) {
                    return (
                      <TableRow
                        key={row.id}
                        className="bg-muted/30 hover:bg-muted/40 border-y border-border/60"
                      >
                        <TableCell colSpan={columnsCount} className="py-2 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LayoutList className="h-4 w-4 text-muted-foreground/70" />
                              <span className="font-bold text-[11px] uppercase tracking-widest text-foreground/60">
                                {rowData.name}
                              </span>
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

                  // --- 3. RENDER STANDARD TASK ROW ---
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
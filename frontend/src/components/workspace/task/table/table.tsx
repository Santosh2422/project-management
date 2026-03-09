
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  ColumnDef,
  VisibilityState,
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
import { useState } from 'react';

import { Table as TanTable } from '@tanstack/react-table';

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
  // Expose table instance to parent so toolbar can render column visibility toggle
  onTableReady?: (table: TanTable<TData>) => void;
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
  onTableReady,
}: DataTableProps<TData>) {

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row: any) => row.subtasks,
  });

  // Expose the table instance to the parent on every render
  // (parent may be null on first render — the ref pattern avoids extra effects)
  onTableReady?.(table);

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
                                // --- FIXED: Use the prop function ---
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
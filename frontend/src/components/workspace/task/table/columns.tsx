import { Column, ColumnDef, Row } from '@tanstack/react-table';
import { format } from 'date-fns';

import { DataTableColumnHeader } from './table-column-header';
import { DataTableRowActions } from './table-row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
  TaskTypeEnum,
} from '@/constant';
import { formatStatusToEnum, getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { priorities, statuses } from './data';
import { TaskType, SectionType } from '@/types/api.type';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- NEW: Define a Union Type for the Table Rows ---
// This tells TypeScript that a row can be a Task OR a Section Header
export type TableRowType = TaskType | (SectionType & { isHeader: boolean });

export const getColumns = (projectId?: string): ColumnDef<TableRowType>[] => {
  const columns: ColumnDef<TableRowType>[] = [
    {
      id: '_id',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => {
        // Skip rendering cell content for Header rows
        if ((row.original as any).isHeader) return null;
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const data = row.original as TaskType;
        if ((row.original as any).isHeader) return null;

        return (
          <div className="flex space-x-2" style={{ paddingLeft: `${row.depth * 2}rem` }}>
            {row.getCanExpand() ? (
              <button
                className="cursor-pointer shrink-0"
                onClick={(e) => { e.stopPropagation(); row.toggleExpanded(); }}
                style={{ cursor: 'pointer' }}
              >
                {row.getIsExpanded() ? '▼' : '▶'}
              </button>
            ) : row.depth > 0 ? (
              <span className="w-4 inline-block shrink-0"></span> // spacer for subtasks without children
            ) : null}
            <Badge variant="outline" className="capitalize shrink-0 h-[25px]">
              {data.taskcode}
            </Badge>
            {data.type === TaskTypeEnum.MILESTONE && (
              <Badge variant="secondary" className="shrink-0 h-[25px] bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
                Milestone
              </Badge>
            )}
            <span className="block truncate lg:max-w-[220px] max-w-[200px] font-medium text-ellipsis">
              {data.title}
            </span>
          </div>
        );
      },
    },
    ...(projectId
      ? []
      : [
        {
          accessorKey: 'project',
          header: ({ column }: { column: Column<TableRowType, unknown> }) => (
            <DataTableColumnHeader column={column} title="Project" />
          ),
          cell: ({ row }: { row: Row<TableRowType> }) => {
            const data = row.original as TaskType;
            const project = data.project;

            if (!project || (row.original as any).isHeader) {
              return null;
            }

            return (
              <div className="flex items-center gap-1">
                <span className="rounded-full border">{project.emoji}</span>
                <span className="block capitalize truncate w-[100px] text-ellipsis">
                  {project.name}
                </span>
              </div>
            );
          },
        },
      ]),
    {
      accessorKey: 'assignees',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assignees" />
      ),
      cell: ({ row }) => {
        if ((row.original as any).isHeader) return null;
        const data = row.original as TaskType;
        const assignees = data.assignees || [];

        return (
          <div className="flex items-center -space-x-2">
            {assignees.map((assignee, index) => {
              const name = assignee?.name || '';
              const initials = getAvatarFallbackText(name);
              const avatarColor = getAvatarColor(name);

              return (
                <Avatar key={assignee._id || index} className="h-6 w-6 border-2 border-background" title={name}>
                  <AvatarImage src={assignee?.profilePicture || ''} alt={name} />
                  <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => {
        if ((row.original as any).isHeader) return null;
        const data = row.original as TaskType;
        return (
          <span className="lg:max-w-[100px] text-sm">
            {data.dueDate ? format(new Date(data.dueDate), 'PPP') : null}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        if ((row.original as any).isHeader) return null;
        const status = statuses.find((status) => status.value === row.getValue('status'));

        if (!status) return null;

        const statusKey = formatStatusToEnum(status.value) as TaskStatusEnumType;
        const Icon = status.icon;

        if (!Icon) return null;

        return (
          <div className="flex lg:w-[120px] items-center">
            <Badge
              variant={TaskStatusEnum[statusKey]}
              className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{status.label}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => {
        if ((row.original as any).isHeader) return null;
        const priority = priorities.find(
          (priority) => priority.value === row.getValue('priority')
        );

        if (!priority) return null;

        const statusKey = formatStatusToEnum(priority.value) as TaskPriorityEnumType;
        const Icon = priority.icon;

        if (!Icon) return null;

        return (
          <div className="flex items-center">
            <Badge
              variant={TaskPriorityEnum[statusKey]}
              className="flex lg:w-[110px] p-1 gap-1 !bg-transparent font-medium !shadow-none uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{priority.label}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if ((row.original as any).isHeader) return null;
        return (
          <DataTableRowActions
            row={row as any}
            key={row.id}
          />
        );
      },
    },
  ];

  return columns;
};
import { FC, useState, useMemo } from 'react';
import { getColumns } from './table/columns';
import { DataTable } from './table/table';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus, Loader2 } from 'lucide-react';
import { DataTableFacetedFilter } from './table/table-faceted-filter';
import { priorities, statuses } from './table/data';
import useTaskTableFilter from '@/hooks/use-task-table-filter';
import { useQuery } from '@tanstack/react-query';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { getAllTasksQueryFn, getProjectSectionsQueryFn } from '@/lib/api';
import { TaskType, SectionType } from '@/types/api.type';
import useGetProjectsInWorkspaceQuery from '@/hooks/api/use-get-projects';
import { DateFilter } from '@/components/resuable/date-filter';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateSectionDialog from '../project/create-section-dialog';
import CreateTaskDialog from './create-task-dialog';
import Papa from 'papaparse';
import { Download } from 'lucide-react';
import { DataTableViewOptions } from './table/table-view-options';
import { VisibilityState } from '@tanstack/react-table';

type Filters = ReturnType<typeof useTaskTableFilter>[0];
type SetFilters = ReturnType<typeof useTaskTableFilter>[1];

const TaskTable = () => {
  const param = useParams();
  const projectId = param.projectId as string;
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useTaskTableFilter();
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  // Column visibility lifted here so the toolbar dropdown and DataTable stay in sync
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = getColumns(projectId);

  // 1. Fetch Sections
  const { data: sectionData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['project-sections', workspaceId, projectId],
    queryFn: () => getProjectSectionsQueryFn({ workspaceId, projectId }),
    enabled: !!projectId && projectId !== 'all',
  });

  // 2. Fetch Tasks
  const { data, isLoading: tasksLoading } = useQuery({
    queryKey: ['all-tasks', workspaceId, pageSize, pageNumber, filters, projectId],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        pageSize,
        pageNumber,
        projectId: projectId || filters.projectId,
        keyword: filters.keyword,
        status: filters.status,
        priority: filters.priority,
        assignees: filters.assignees,
        dueDate: filters.dueDate,
      }),
  });

  const sections: SectionType[] = sectionData?.sections || [];
  const allTasks: TaskType[] = data?.tasks || [];
  const totalCount = data?.pagination?.totalCount || 0;

  // --- 3. DATA TRANSFORMATION ---
  // We flatten the sections and tasks into a single array for the unified table
  const tableData = useMemo(() => {
    // 1. Build the hierarchy of tasks
    const tasksMap = new Map();
    const rootTasks: any[] = [];

    allTasks.forEach(task => {
      tasksMap.set(task._id, { ...task, subtasks: [] });
    });

    allTasks.forEach(task => {
      if (task.parentId && tasksMap.has(task.parentId)) {
        tasksMap.get(task.parentId).subtasks.push(tasksMap.get(task._id));
      } else {
        rootTasks.push(tasksMap.get(task._id));
      }
    });

    if (!projectId || projectId === 'all' || sections.length === 0) {
      return rootTasks;
    }

    return sections.flatMap((section) => {
      const sectionTasks = rootTasks.filter((task) => {
        const sId = typeof task.section === 'object' ? task.section?._id : task.section;
        return sId === section._id;
      });

      return [
        { ...section, isHeader: true }, // Inject a header row object
        ...sectionTasks,
      ];
    });
  }, [sections, allTasks, projectId]);

  if (sectionsLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 relative">
      <DataTableFilterToolbar
        isLoading={tasksLoading}
        projectId={projectId}
        filters={filters}
        setFilters={setFilters}
        tableData={tableData}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      <DataTable
        isLoading={tasksLoading}
        data={tableData}
        columns={columns}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        pagination={{ totalCount, pageNumber, pageSize }}
        onRowClick={(row: any) => {
          if (row.isHeader) return; // Prevent navigation on header rows
          navigate(`/workspace/${workspaceId}/project/${projectId}/task/${row._id}`);
        }}
        onAddTaskClick={(sectionId) => {
          setSelectedSectionId(sectionId);
          setIsTaskDialogOpen(true);
        }}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={(updater) => {
          setColumnVisibility(prev =>
            typeof updater === 'function' ? updater(prev) : updater
          );
        }}
      />

      {projectId && projectId !== 'all' && (
        <Button
          variant="outline"
          className="w-full border-dashed py-4 text-muted-foreground hover:border-primary hover:text-primary"
          onClick={() => setIsSectionDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Section
        </Button>
      )}

      <CreateSectionDialog
        open={isSectionDialogOpen}
        setOpen={setIsSectionDialogOpen}
        projectId={projectId}
        workspaceId={workspaceId}
      />

      <CreateTaskDialog
        open={isTaskDialogOpen}
        setOpen={setIsTaskDialogOpen}
        projectId={projectId}
        sectionId={selectedSectionId}
      />
    </div>
  );
};

// --- Filters Toolbar Component ---
// (Remains unchanged from previous step)
interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  projectId?: string;
  filters: Filters;
  setFilters: SetFilters;
  tableData: any[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (v: VisibilityState) => void;
}

const exportTasksToCSV = (data: any[]) => {
  // 1. Flatten the nested structure (sections -> tasks -> subtasks)
  const flattenedTasks: any[] = [];

  const traverse = (node: any, sectionName: string, depth: number = 0) => {
    // Only process actual tasks, not header rows
    if (!node.isHeader) {
      // Use ASCII prefix for subtasks to avoid Excel encoding issues
      const prefix = depth > 0 ? `${'  '.repeat(depth)}-> ` : '';

      let formattedDate = '';
      if (node.dueDate) {
        try {
          const dateObj = new Date(node.dueDate);
          if (!isNaN(dateObj.getTime())) {
            // Added space prefix so Excel treats it politely avoiding `####` formatting constraints
            formattedDate = ` ${format(dateObj, 'MMM d, yyyy')}`;
          }
        } catch (e) {
          // ignore
        }
      }

      flattenedTasks.push({
        TaskCode: node.taskcode || '',
        Title: `${prefix}${node.title}`,
        Section: sectionName,
        Status: node.status,
        Priority: node.priority,
        DueDate: formattedDate,
      });
    }

    // Traverse subtasks if any
    if (node.subtasks && node.subtasks.length > 0) {
      node.subtasks.forEach((subtask: any) => traverse(subtask, sectionName, depth + 1));
    }
  };

  // 2. Iterate through top level nodes
  let currentSection = 'Uncategorized';
  data.forEach(node => {
    if (node.isHeader) {
      currentSection = node.name || 'Unknown';
    } else {
      traverse(node, currentSection);
    }
  });

  // 3. Convert to CSV string and download
  const csv = Papa.unparse(flattenedTasks);
  // Prepend UTF-8 BOM so Excel opens the file with correct encoding
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `tasks_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DataTableFilterToolbar: FC<DataTableFilterToolbarProps> = ({
  isLoading,
  projectId,
  filters,
  setFilters,
  tableData,
  columnVisibility,
  onColumnVisibilityChange,
}) => {
  const workspaceId = useWorkspaceId();
  const { data } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    skip: !!projectId,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projects = data?.projects || [];
  const members = memberData?.members || [];

  const projectOptions = projects?.map((project) => ({
    label: (
      <div className="flex items-center gap-1">
        <span>{project.emoji}</span>
        <span>{project.name}</span>
      </div>
    ),
    value: project._id,
  }));

  const assigneesOptions = members?.map((member) => {
    const name = member.userId?.name || 'Unknown';
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);
    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={member.userId?.profilePicture || ''} alt={name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: member.userId._id,
    };
  });

  const handleFilterChange = (key: keyof Filters, values: string[]) => {
    setFilters({
      ...filters,
      [key]: values.length > 0 ? values.join(',') : null,
    });
  };

  let selectedDateRange: DateRange | undefined = undefined;
  if (filters.dueDate) {
    const [fromStr, toStr] = filters.dueDate.split(',');
    selectedDateRange = {
      from: fromStr ? new Date(fromStr) : undefined,
      to: toStr ? new Date(toStr) : undefined,
    };
  }

  const handleDateFilterChange = (range: DateRange | undefined) => {
    if (!range) {
      setFilters({ ...filters, dueDate: null });
      return;
    }

    // Convert the selected days to the exact local start and end times
    let fromStr = '';
    if (range.from) {
      const start = new Date(range.from);
      start.setHours(0, 0, 0, 0);
      fromStr = start.toISOString();
    }

    let toStr = '';
    if (range.to) {
      const end = new Date(range.to);
      end.setHours(23, 59, 59, 999);
      toStr = end.toISOString();
    }
    setFilters({ ...filters, dueDate: `${fromStr},${toStr}` });
  };

  return (
    <div className="flex flex-col lg:flex-row w-full items-start space-y-2 mb-2 lg:mb-0 lg:space-x-2 lg:space-y-0">
      <Input
        placeholder="Filter tasks..."
        value={filters.keyword || ''}
        onChange={(e) => setFilters({ keyword: e.target.value })}
        className="h-8 w-full lg:w-[250px]"
      />
      <DataTableFacetedFilter
        title="Status"
        multiSelect={true}
        options={statuses}
        disabled={isLoading}
        selectedValues={filters.status?.split(',') || []}
        onFilterChange={(values) => handleFilterChange('status', values)}
      />
      <DataTableFacetedFilter
        title="Priority"
        multiSelect={true}
        options={priorities}
        disabled={isLoading}
        selectedValues={filters.priority?.split(',') || []}
        onFilterChange={(values) => handleFilterChange('priority', values)}
      />
      <DataTableFacetedFilter
        title="Assigned To"
        multiSelect={true}
        options={assigneesOptions}
        disabled={isLoading}
        selectedValues={filters.assignees?.split(',') || []}
        onFilterChange={(values) => handleFilterChange('assignees', values)}
      />
      <DateFilter
        title="Due Date"
        disabled={isLoading}
        selectedRange={selectedDateRange}
        onFilterChange={handleDateFilterChange}
      />
      {!projectId && (
        <DataTableFacetedFilter
          title="Projects"
          multiSelect={false}
          options={projectOptions}
          disabled={isLoading}
          selectedValues={filters.projectId?.split(',') || []}
          onFilterChange={(values) => handleFilterChange('projectId', values)}
        />
      )}
      {Object.values(filters).some((v) => v !== null && v !== '') && (
        <Button
          disabled={isLoading}
          variant="ghost"
          className="h-8 px-2 lg:px-3 shrink-0"
          onClick={() => setFilters({
            keyword: null,
            status: null,
            priority: null,
            projectId: null,
            assignees: null,
            dueDate: null,
          })}
        >
          Reset <X className="ml-2 h-4 w-4" />
        </Button>
      )}

      <Button
        variant="outline"
        className="h-8 px-2 lg:px-3 shrink-0 ml-auto flex items-center gap-2"
        onClick={() => exportTasksToCSV(tableData)}
        disabled={isLoading || tableData.length === 0}
      >
        <Download className="w-4 h-4" /> Export CSV
      </Button>

      {/* Columns toggle — at the very end of the row */}
      <DataTableViewOptions
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
    </div>
  );
};

export default TaskTable;
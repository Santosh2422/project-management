// src/components/workspace/project/section-group.tsx
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/workspace/task/table/table';
import { TaskType } from '@/types/api.type';

interface SectionGroupProps {
  sectionName: string;
  sectionId: string;
  tasks: TaskType[];
  columns: any[];
  onRowClick: (task: TaskType) => void;
  onAddTask: (sectionId: string) => void; // Function from TaskTable
  isLoading?: boolean;
  pagination: any;
}

export const SectionGroup = ({ 
  sectionName, 
  sectionId, 
  tasks, 
  columns, 
  onRowClick, 
  onAddTask,
  isLoading,
  pagination
}: SectionGroupProps) => {
  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex items-center justify-between px-2 group">
        <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          {sectionName}
          <span className="text-xs font-normal lowercase bg-muted px-2 py-0.5 rounded-full">
            {tasks.length} tasks
          </span>
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onAddTask(sectionId)} // Trigger from the Section Header
        >
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={tasks} 
        isLoading={isLoading}
        pagination={pagination}
        onRowClick={onRowClick} 
        // --- THIS IS THE MISSING LINK ---
        onAddTaskClick={onAddTask} 
      />
    </div>
  );
};
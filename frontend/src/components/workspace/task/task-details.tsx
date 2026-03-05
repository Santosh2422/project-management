// src/pages/TaskDetailsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// IMPORT YOUR EXACT FORM HERE!
import EditTaskForm from '@/components/workspace/task/edit-task-form'; 

export default function TaskDetailsPage() {
  const { workspaceId, projectId, taskId } = useParams();
  const navigate = useNavigate();

  if (!workspaceId || !taskId) return <div>Task not found</div>;

  return (
    <div className="w-full h-full p-6 lg:p-10 flex flex-col gap-6 overflow-y-auto">
      
      {/* 1. Header & Back Button */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Task Details</h1>
      </div>

      {/* 2. Main Layout - Split into Two Columns on Desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: The Core Details (Your existing form) */}
        <div className="xl:col-span-2 bg-card p-6 rounded-xl border shadow-sm">
          <EditTaskForm 
            projectId={projectId === 'all' ? '' : projectId!} 
            taskId={taskId}
            fromAllTask={projectId === 'all'}
            // We pass an empty function because there is no dialog to close!
            onClose={() => {}} 
          />
        </div>

        {/* RIGHT COLUMN: The "New Features" Zone */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Subtasks Box */}
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Subtasks</h2>
            {/* You will build your SubtaskList component here later */}
            <p className="text-sm text-muted-foreground">No subtasks yet.</p>
            <Button variant="secondary" className="w-full mt-4">+ Add Subtask</Button>
          </div>

          {/* Comments Box */}
          <div className="bg-card p-6 rounded-xl border shadow-sm h-full min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Comments</h2>
            {/* You will build your CommentFeed component here later */}
            <p className="text-sm text-muted-foreground">Be the first to comment.</p>
          </div>

        </div>
      </div>

    </div>
  );
}
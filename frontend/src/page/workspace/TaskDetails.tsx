import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';

// IMPORTANT: Adjust this import path to exactly where your EditTaskForm is located!
import EditTaskForm from '@/components/workspace/task/edit-task-form'; 

const TaskDetails = () => {
  const { workspaceId, projectId, taskId } = useParams();
  const navigate = useNavigate();

  // Failsafe: If the URL is missing crucial data, don't crash the app
  if (!workspaceId || !taskId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Task not found or invalid URL.</p>
      </div>
    );
  }

  // Determine if this was opened from the "All Tasks" view
  const isFromAllTasks = projectId === 'all' || !projectId;
  const safeProjectId = isFromAllTasks ? '' : projectId;

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
      
      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Task Overview
        </h1>
      </div>

      {/* 2. Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Your Existing Edit Form */}
        <div className="xl:col-span-2 bg-card p-6 rounded-xl border shadow-sm">
          <EditTaskForm 
            projectId={safeProjectId} 
            taskId={taskId}
            fromAllTask={isFromAllTasks}
            // Passing navigate(-1) here means when the user clicks "Edit" (Save) 
            // and the API succeeds, it will automatically take them back to the table.
            // If you want them to stay on the page after saving, change this to: () => {}
            onClose={() => navigate(-1)} 
          />
        </div>

        {/* RIGHT COLUMN: The New Features Zone (Subtasks & Comments) */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Subtasks Section Placeholder */}
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <ListTodo className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Subtasks</h2>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Break this task down into smaller, actionable steps.
              </p>
              <Button variant="secondary" className="w-full">
                + Add Subtask
              </Button>
            </div>
          </div>

          {/* Comments Section Placeholder */}
          <div className="bg-card p-6 rounded-xl border shadow-sm flex-1 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Activity & Comments</h2>
            </div>
            
            <div className="flex-1 flex items-center justify-center py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No comments yet. Be the first to start the conversation!
              </p>
            </div>
            
            {/* Fake Comment Input for UI visualization */}
            <div className="mt-auto pt-4 border-t">
              <Button variant="outline" className="w-full justify-start text-muted-foreground h-10 cursor-not-allowed">
                Type a comment...
              </Button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default TaskDetails;
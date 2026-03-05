import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
    // 1. Changed to standard background. No more gray contrast making it look like a pop-up background.
    <div className="w-full h-full overflow-y-auto bg-background">
      
      {/* 2. Added max-w-4xl mx-auto to center it and make it highly readable like a Notion doc */}
      <div className="max-w-4xl mx-auto p-4 md:py-10 flex flex-col gap-6">
        
        {/* Header / Breadcrumb Area */}
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Back to tasks
          </span>
        </div>

        {/* 3. The Task Form Container - Completely flattened! No borders, no shadows, no card background. */}
        <div className="w-full">
          <EditTaskForm 
            projectId={safeProjectId} 
            taskId={taskId}
            fromAllTask={isFromAllTasks}
            onClose={() => navigate(-1)} 
          />
        </div>

      </div>
    </div>
  );
};

export default TaskDetails;
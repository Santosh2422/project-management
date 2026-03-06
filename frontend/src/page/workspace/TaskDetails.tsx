import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// IMPORTANT: Adjust these import paths to exactly where your components are located!
import EditTaskForm from '@/components/workspace/task/edit-task-form'; 
import CommentSection from '@/components/workspace/task/comment-section';

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
    <div className="w-full h-full overflow-y-auto bg-background">
      
      {/* 1. Fixed the gap: Changed `md:py-10` to `md:pt-6 md:pb-10`. 
        This pulls the content closer to your navbar while leaving breathing room at the bottom. 
      */}
      <div className="w-full p-4 md:pt-6 md:pb-10 flex flex-col gap-6">
        
        {/* Header / Breadcrumb Area */}
        <div className="flex items-center mb-2">
          {/* 2. UI Polish: Combined the Arrow and Text into one single ghost button.
            The `-ml-3` offsets the button's internal padding so the text visually aligns 
            perfectly with the left edge of the form below it.
          */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1.5 -ml-3 h-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to tasks</span>
          </Button>
        </div>

        {/* 3. The Task Form Container */}
        <div className="w-full">
          <EditTaskForm 
            projectId={safeProjectId} 
            taskId={taskId}
            fromAllTask={isFromAllTasks}
            onClose={() => navigate(-1)} 
          />
          
          {/* --- NEW: The Comment Section is rendered right below the task form --- */}
          <CommentSection 
            workspaceId={workspaceId} 
            projectId={safeProjectId} 
            taskId={taskId} 
          />
        </div>

      </div>
    </div>
  );
};

export default TaskDetails;
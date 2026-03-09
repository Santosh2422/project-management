/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'; // 1. Added useState
import { useParams } from 'react-router-dom';
import CreateTaskDialog from '../task/create-task-dialog';
import EditProjectDialog from './edit-project-dialog';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProjectByIdQueryFn } from '@/lib/api';
import PermissionsGuard from '@/components/resuable/permission-guard';
import { Permissions } from '@/constant';

const ProjectHeader = () => {
  const param = useParams();
  const projectId = param.projectId as string;
  const workspaceId = useWorkspaceId();

  // 2. State to manage the Create Task Dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ['singleProject', projectId],
    queryFn: () => getProjectByIdQueryFn({ workspaceId, projectId }),
    staleTime: Infinity,
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });

  const project = data?.project;
  const projectEmoji = project?.emoji || '📊';
  const projectName = project?.name || 'Untitled project';

  const renderContent = () => {
    if (isPending) return <span>Loading...</span>;
    if (isError) return <span>Error occured</span>;
    return (
      <>
        <span>{projectEmoji}</span>
        {projectName}
      </>
    );
  };

  return (
    <div className="flex items-center justify-between space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-3 text-xl font-medium truncate tracking-tight">
          {renderContent()}
        </h2>
        <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
          <EditProjectDialog project={project} />
        </PermissionsGuard>
      </div>

      <div className="flex items-center gap-2">
        {/* 3. Button to trigger the controlled dialog */}
        {/* <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button> */}

        {/* 4. Pass the required open/setOpen props to fix the TS error */}
        <CreateTaskDialog 
          projectId={projectId} 
          open={isTaskDialogOpen} 
          setOpen={setIsTaskDialogOpen} 
        />
      </div>
    </div>
  );
};

export default ProjectHeader;
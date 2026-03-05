import { useState } from 'react';
import { Row } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react'; // Using a trash icon instead of 3 dots

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/resuable/confirm-dialog';
import { TaskType } from '@/types/api.type';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { deleteTaskMutationFn } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface DataTableRowActionsProps {
  row: Row<TaskType>;
  projectId: string;
}

export function DataTableRowActions({ row, projectId }: DataTableRowActionsProps) {
  const [openDeleteDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTaskMutationFn,
  });

  const taskId = row.original._id as string;
  const taskCode = row.original.taskcode;

  const handleConfirm = () => {
    mutate(
      { workspaceId, taskId },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
          toast({ title: 'Success', description: data.message, variant: 'success' });
          setTimeout(() => setOpenDialog(false), 100);
        },
        onError: (error) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <>
      {/* 1. Direct Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive/10"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation(); // PREVENTS THE ROW CLICK FROM TRIGGERING
          setOpenDialog(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete Task</span>
      </Button>

      {/* 2. The Confirmation Dialog remains exactly the same */}
      <ConfirmDialog
        isOpen={openDeleteDialog}
        isLoading={isPending}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete ${taskCode}?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
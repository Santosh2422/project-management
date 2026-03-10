import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProjectAnalytics from "@/components/workspace/project/project-analytics";
import ProjectHeader from "@/components/workspace/project/project-header";
import TaskTable from "@/components/workspace/task/task-table";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getProjectByIdQueryFn, getProjectMembersQueryFn } from "@/lib/api";
import ProjectMembers from "@/components/workspace/project/project-members";
import { Loader, Lock, Pencil, Check, X } from "lucide-react";
import { useAuthContext } from "@/context/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { editProjectMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const workspaceId = useWorkspaceId();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");

  const { data, isPending, isError } = useQuery({
    queryKey: ['singleProject', projectId],
    queryFn: () => getProjectByIdQueryFn({ workspaceId, projectId: projectId as string }),
    enabled: !!projectId,
  });

  const { data: memberData, isPending: membersLoading } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => getProjectMembersQueryFn({ workspaceId, projectId: projectId as string }),
    enabled: !!projectId,
  });

  const project = data?.project;
  const members = memberData?.members || [];
  const isMember = members.some((m: any) => m.userId?._id === user?._id);
  const isOwner = project?.createdBy?._id === user?._id;

  const editProjectMutation = useMutation({
    mutationFn: editProjectMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['singleProject', projectId] });
      toast({ title: 'Project description updated', variant: 'success' });
      setIsEditingDesc(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update description', description: error.message, variant: 'destructive' });
    }
  });

  const handleSaveDescription = () => {
    if (!project || !workspaceId || !projectId) return;
    editProjectMutation.mutate({
      workspaceId,
      projectId,
      data: {
        name: project.name,
        description: descValue,
        emoji: project.emoji || "📊",
      }
    });
  };

  if (isPending || membersLoading) return (
    <div className="w-full flex justify-center py-20">
      <Loader className="animate-spin w-8 h-8 text-primary" />
    </div>
  );

  if (isError || !project) return (
    <div className="w-full text-center py-20 text-muted-foreground">
      Project not found or you don't have access.
    </div>
  );

  // Non-members fallback screen
  if (!isMember) {
    return (
      <div className="w-full space-y-6 py-4 md:pt-3">
        <ProjectHeader />
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/10 space-y-4 shadow-sm mx-auto max-w-2xl mt-8">
          <div className="p-4 bg-muted rounded-full text-muted-foreground">
            <Lock className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-lg">Project Membership Required</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              You must be added to this project to view its details, members, and tasks. Ask the project creator to add you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="w-full space-y-6 py-4 md:pt-3">
      <ProjectHeader />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col group relative min-h-[100px]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  {!isEditingDesc && isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3"
                      onClick={() => {
                        setDescValue(project.description || "");
                        setIsEditingDesc(true);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2 mt-1">
                    <Textarea
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      placeholder="Enter project description..."
                      className="min-h-[80px] text-sm resize-y"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setIsEditingDesc(false)}
                      >
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSaveDescription}
                        disabled={editProjectMutation.isPending}
                      >
                        {editProjectMutation.isPending ? <Loader className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {project.description || <span className="text-muted-foreground italic">No description provided for this project.</span>}
                  </p>
                )}
              </div>

              <ProjectAnalytics />
            </div>

            <div className="space-y-6">
              <div className="bg-card p-4 rounded-xl border shadow-sm">
                <ProjectMembers projectId={project._id} createdBy={project.createdBy?._id} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetails;

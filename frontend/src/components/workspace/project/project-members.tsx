import { Loader, Plus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProjectMembersQueryFn,
    getMembersInWorkspaceQueryFn,
    addProjectMemberMutationFn,
    removeProjectMemberMutationFn
} from '@/lib/api';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { useAuthContext } from '@/context/auth-provider';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from '@/hooks/use-toast';

const ProjectMembers = (props: { projectId: string; createdBy?: string }) => {
    const { projectId, createdBy } = props;
    const workspaceId = useWorkspaceId();
    const { user } = useAuthContext();
    const queryClient = useQueryClient();

    const isOwner = user?._id === createdBy;

    const { data, isPending } = useQuery({
        queryKey: ['projectMembers', projectId],
        queryFn: () => getProjectMembersQueryFn({ workspaceId, projectId }),
        enabled: !!projectId && !!workspaceId,
    });

    const { data: workspaceMembersData } = useQuery({
        queryKey: ['workspaceMembers', workspaceId],
        queryFn: () => getMembersInWorkspaceQueryFn(workspaceId),
        enabled: !!workspaceId && isOwner,
    });

    const addMemberMutation = useMutation({
        mutationFn: addProjectMemberMutationFn,
        onSuccess: () => {
            toast({ title: 'Member added', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
        },
        onError: (error: any) => {
            toast({ title: 'Failed to add member', description: error.message, variant: 'destructive' });
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: removeProjectMemberMutationFn,
        onSuccess: () => {
            toast({ title: 'Member removed', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
        },
        onError: (error: any) => {
            toast({ title: 'Failed to remove member', description: error.message, variant: 'destructive' });
        }
    });

    const members = data?.members || [];
    const workspaceMembers = workspaceMembersData?.members || [];

    // Filter out members who are already in the project
    const eligibleMembers = workspaceMembers.filter(
        (wm: any) => !members.some((m: any) => m.userId?._id === wm.userId?._id)
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium">Project Members</h5>
                {isOwner && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[240px] p-2 max-h-[300px] overflow-y-auto z-50">
                            <h4 className="font-medium text-sm mb-2 px-1">Add Workspace Members</h4>
                            {eligibleMembers.length === 0 ? (
                                <div className="p-2 text-sm text-center text-muted-foreground">No more members to add.</div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {eligibleMembers.map((wm: any) => (
                                        <div
                                            key={wm.userId?._id}
                                            className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                                            onClick={() => {
                                                addMemberMutation.mutate({ workspaceId, projectId, memberId: wm.userId?._id });
                                                // Close manually if needed, but react-query invalidation usually causes re-render
                                            }}
                                        >
                                            <Avatar className="h-6 w-6 mr-2">
                                                <AvatarFallback className="text-[10px]">{getAvatarFallbackText(wm.userId?.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate text-sm font-medium">{wm.userId?.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                )}

            </div>
            {isPending ? (
                <Loader className="w-6 h-6 animate-spin mx-auto" />
            ) : (
                <div className="flex flex-col gap-3">
                    {members.map((member: any) => {
                        const memberUser = member.userId;
                        const name = memberUser?.name || 'Unknown';
                        const initials = getAvatarFallbackText(name);
                        const avatarColor = getAvatarColor(name);
                        const isCreator = memberUser?._id === createdBy;

                        return (
                            <div key={member._id} className="flex items-center justify-between p-2 border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={memberUser?.profilePicture || ''} alt={name} />
                                        <AvatarFallback className={`${avatarColor} text-[10px]`}>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium truncate max-w-[150px]">{name}</span>
                                        {isCreator && <span className="text-[10px] text-muted-foreground">Owner</span>}
                                    </div>
                                </div>

                                {isOwner && !isCreator && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeMemberMutation.mutate({ workspaceId, projectId, memberId: memberUser?._id })}
                                        disabled={removeMemberMutation.isPending}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                    {members.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No members found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectMembers;

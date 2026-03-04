import PermissionsGuard from '@/components/resuable/permission-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Permissions } from '@/constant';
import { useAuthContext } from '@/context/auth-provider';
import { toast } from '@/hooks/use-toast';
import { CheckIcon, CopyIcon, Loader, LogInIcon } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitedUserJoinWorkspaceMutationFn } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const InviteMember = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspace, workspaceLoading } = useAuthContext();

  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // 1. Setup the Mutation
  const { mutate, isPending: isJoining } = useMutation({
    mutationFn: invitedUserJoinWorkspaceMutationFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['userWorkspaces'],
      });
      toast({
        title: 'Success',
        description: 'Joined workspace successfully!',
        variant: 'success',
      });
      setJoinCode(''); // Clear input
      navigate(`/workspace/${data.workspaceId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join workspace',
        variant: 'destructive',
      });
    },
  });

  const inviteCode = workspace?.inviteCode || '';

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).then(() => {
        setCopied(true);
        toast({
          title: 'Copied',
          description: 'Invite code copied to clipboard',
          variant: 'success',
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleJoinWorkspace = () => {
    if (!joinCode.trim()) return;
    // 2. Trigger mutation with the inviteCode in the body
    mutate(joinCode.trim());
  };

  return (
    <div className="flex flex-col pt-0.5 px-0 space-y-6">
      {/* SECTION 1: SHARE YOUR CODE */}
      <div>
        <h5 className="text-lg leading-[30px] font-semibold mb-1">
          Your Workspace Invite Code
        </h5>
        <p className="text-sm text-muted-foreground leading-tight">
          Share this unique code with others to allow them to join your current workspace.
        </p>
        
        <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>
          {workspaceLoading ? (
            <div className="flex justify-center py-4">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="flex py-3 gap-2">
              <Label htmlFor="invite-code" className="sr-only">Invite Code</Label>
              <Input
                id="invite-code"
                disabled={true}
                className="font-mono tracking-wider disabled:opacity-100 disabled:pointer-events-none select-all"
                value={inviteCode}
                readOnly
              />
              <Button
                type="button"
                className="shrink-0"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </PermissionsGuard>
      </div>

      <hr className="border-border" />

      {/* SECTION 2: JOIN ANOTHER WORKSPACE */}
      <div>
        <h5 className="text-lg leading-[30px] font-semibold mb-1">
          Join a Workspace
        </h5>
        <p className="text-sm text-muted-foreground leading-tight">
          Enter an invite code provided by another administrator to join their workspace.
        </p>
        
        <div className="flex py-3 gap-2">
          <Label htmlFor="join-code" className="sr-only">Join Code</Label>
          <Input
            id="join-code"
            placeholder="Enter invite code (e.g. ABC-123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            disabled={isJoining}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinWorkspace()}
          />
          <Button
            type="button"
            className="shrink-0 gap-2"
            onClick={handleJoinWorkspace}
            disabled={!joinCode.trim() || isJoining}
          >
            {isJoining ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <LogInIcon className="h-4 w-4" />
            )}
            Join
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteMember;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  CheckIcon, 
  CopyIcon, 
  Loader, 
  LogInIcon, 
  CheckCircle, 
  XCircle, 
  UserPlus 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/auth-provider';
import PermissionsGuard from '@/components/resuable/permission-guard';
import { Permissions } from '@/constant';

// These should match the functions in your @/lib/api file
import { 
  invitedUserJoinWorkspaceMutationFn, 
  getWorkspaceJoinRequestsQueryFn, 
  approveJoinRequestMutationFn,
  rejectJoinRequestMutationFn 
} from '@/lib/api';

const InviteMember = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspace, workspaceLoading } = useAuthContext();

  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const workspaceId = workspace?._id || '';
  const inviteCode = workspace?.inviteCode || '';

  // --- 1. FETCH PENDING REQUESTS ---
  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['workspaceRequests', workspaceId],
    queryFn: () => getWorkspaceJoinRequestsQueryFn(workspaceId),
    enabled: !!workspaceId, // Only fetch if we have a workspace
  });

  // --- 2. JOIN WORKSPACE MUTATION ---
  const { mutate: joinWorkspace, isPending: isJoining } = useMutation({
    mutationFn: (code: string) => invitedUserJoinWorkspaceMutationFn(code),
    onSuccess: (data) => {
      if (data.status === 'PENDING') {
        toast({
          title: 'Request Sent',
          description: data.message,
        });
        setJoinCode('');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['userWorkspaces'] });
      toast({ title: 'Success', description: 'Joined successfully!', variant: 'success' });
      navigate(`/workspace/${data.workspaceId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join',
        variant: 'destructive',
      });
    },
  });

  // --- 3. APPROVE/REJECT MUTATIONS ---
  const { mutate: handleRequestAction, isPending: isActioning } = useMutation({
    mutationFn: ({ requestId, type }: { requestId: string; type: 'APPROVE' | 'REJECT' }) => 
      type === 'APPROVE' 
        ? approveJoinRequestMutationFn(requestId) 
        : rejectJoinRequestMutationFn(requestId),
    onSuccess: (_, variables) => {
      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaceRequests', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaceMembers', workspaceId] });
      
      toast({
        title: variables.type === 'APPROVE' ? 'Approved' : 'Rejected',
        description: `Request has been ${variables.type.toLowerCase()}ed.`,
        variant: variables.type === 'APPROVE' ? 'success' : 'default',
      });
    },
  });

  // --- HANDLERS ---
  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).then(() => {
        setCopied(true);
        toast({ title: 'Copied', description: 'Invite code copied', variant: 'success' });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const onJoinSubmit = () => {
    if (!joinCode.trim()) return;
    joinWorkspace(joinCode.trim());
  };

  return (
    <div className="flex flex-col pt-0.5 px-0 space-y-8">
      
      {/* SECTION 1: YOUR INVITE CODE (For others to join you) */}
      <section>
        <h5 className="text-lg font-semibold mb-1">Workspace Invite Code</h5>
        <p className="text-sm text-muted-foreground mb-4">
          Share this code with others to let them request access.
        </p>
        
        <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>
          {workspaceLoading ? (
            <Loader className="w-6 h-6 animate-spin" />
          ) : (
            <div className="flex gap-2 max-w-md">
              <Input
                readOnly
                value={inviteCode}
                className="font-mono tracking-widest bg-muted"
              />
              <Button size="icon" onClick={handleCopy}>
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </PermissionsGuard>
      </section>

      <hr />

      {/* SECTION 2: JOIN A WORKSPACE (For you to join others) */}
      <section>
        <h5 className="text-lg font-semibold mb-1">Join a Workspace</h5>
        <p className="text-sm text-muted-foreground mb-4">
          Enter an invite code to request access to another workspace.
        </p>
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="e.g. ABC-123"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            disabled={isJoining}
          />
          <Button onClick={onJoinSubmit} disabled={isJoining || !joinCode.trim()}>
            {isJoining ? <Loader className="h-4 w-4 animate-spin" /> : <LogInIcon className="h-4 w-4 mr-2" />}
            Join
          </Button>
        </div>
      </section>

      <hr />

      {/* SECTION 3: PENDING APPROVALS (The "Waiting Room" List) */}
      <PermissionsGuard requiredPermission={Permissions.ADD_MEMBER}>
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h5 className="text-lg font-semibold">Pending Requests</h5>
          </div>

          {isLoadingRequests ? (
            <div className="flex justify-center py-6"><Loader className="animate-spin" /></div>
          ) : requests && requests.length > 0 ? (
            <div className="grid gap-3">
              {requests.map((req: any) => (
                <div key={req._id} className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
                  <div>
                    <p className="font-medium">{req.userId?.name || 'New User'}</p>
                    <p className="text-xs text-muted-foreground">{req.userId?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => handleRequestAction({ requestId: req._id, type: 'REJECT' })}
                      disabled={isActioning}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleRequestAction({ requestId: req._id, type: 'APPROVE' })}
                      disabled={isActioning}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
              No pending join requests found.
            </div>
          )}
        </section>
      </PermissionsGuard>
    </div>
  );
};

export default InviteMember;
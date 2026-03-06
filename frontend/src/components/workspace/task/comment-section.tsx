// src/components/workspace/task/comment-section.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader, Send, Trash2 } from 'lucide-react'; // <-- IMPORTED Trash2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  getTaskCommentsQueryFn, 
  createCommentMutationFn,
  deleteCommentMutationFn, // <-- IMPORTED new delete mutation
  getCurrentUserQueryFn // <-- IMPORTED to check ownership
} from '@/lib/api';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CommentSection({
  workspaceId,
  projectId,
  taskId,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
}) {
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  // 1. Fetch current user to check if they own the comments
  const { data: currentUserData } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUserQueryFn,
  });
  const currentUserId = currentUserData?.user?._id;

  // Fetch Comments
  const { data, isPending } = useQuery({
    queryKey: ['task-comments', workspaceId, taskId],
    queryFn: () => getTaskCommentsQueryFn({ workspaceId, taskId }),
    enabled: !!workspaceId && !!taskId,
  });

  // Create Mutation
  const { mutate: postComment, isPending: isPosting } = useMutation({
    mutationFn: createCommentMutationFn,
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task-comments', workspaceId, taskId] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // 2. NEW Delete Mutation
  const { mutate: deleteComment, isPending: isDeleting } = useMutation({
    mutationFn: deleteCommentMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', workspaceId, taskId] });
      toast({ title: 'Deleted', description: 'Comment removed successfully.', variant: 'success' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    postComment({ workspaceId, projectId, taskId, content: commentText });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePostComment();
    }
  };

  const comments = data?.comments || [];

  return (
    <div className="w-full mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 tracking-tight">Activity & Comments</h3>
      
      <div className="flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden">
        
        {/* Scrollable Comments List Area */}
        <div className="flex flex-col p-4 overflow-y-auto max-h-[350px] scrollbar min-h-[100px]">
          {isPending ? (
            <div className="flex w-full h-full items-center justify-center py-8">
              <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">No comments yet.</p>
          ) : (
            comments.map((comment: any) => {
              const userName = comment.createdBy?.name || 'Unknown';
              const initials = getAvatarFallbackText(userName);
              const avatarColor = getAvatarColor(userName);
              
              // 3. Check ownership
              const isOwner = currentUserId === comment.createdBy?._id;

              return (
                // Added "group" class here to detect hover state for the delete button
                <div key={comment._id} className="group flex items-start justify-between gap-3 py-2 border-b last:border-0 border-border/40 relative">
                  
                  <div className="flex items-start gap-3 w-full pr-8">
                    <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                      <AvatarImage src={comment.createdBy?.profilePicture} />
                      <AvatarFallback className={cn(avatarColor, "text-[10px]")}>{initials}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-sm leading-relaxed">
                      <span className="font-semibold text-foreground mr-2">{userName}</span>
                      <span className="text-foreground/90">{comment.content}</span>
                      <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* 4. Delete Button - Only visible if the user owns the comment and they hover over it */}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={isDeleting}
                      onClick={() => deleteComment({ workspaceId, taskId, commentId: comment._id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  
                </div>
              );
            })
          )}
        </div>

        {/* Single Row Input at the Bottom */}
        <div className="p-3 bg-muted/10 border-t flex items-center gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="flex-1 bg-background h-9 border-muted-foreground/20 focus-visible:ring-1"
            autoComplete="off"
          />
          <Button 
            size="sm"
            className="h-9 px-4 shrink-0"
            onClick={handlePostComment} 
            disabled={!commentText.trim() || isPosting}
          >
            {isPosting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        
      </div>
    </div>
  );
}
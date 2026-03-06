// src/components/workspace/task/comment-section.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTaskCommentsQueryFn, createCommentMutationFn } from '@/lib/api';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Make sure cn is imported

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

  const { data, isPending } = useQuery({
    queryKey: ['task-comments', workspaceId, taskId],
    queryFn: () => getTaskCommentsQueryFn({ workspaceId, taskId }),
    enabled: !!workspaceId && !!taskId,
  });

  const { mutate, isPending: isPosting } = useMutation({
    mutationFn: createCommentMutationFn,
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task-comments', workspaceId, taskId] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    mutate({ workspaceId, projectId, taskId, content: commentText });
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
      
      {/* The Single Box Container */}
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

              return (
                <div key={comment._id} className="flex items-start gap-3 py-2 border-b last:border-0 border-border/40">
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarImage src={comment.createdBy?.profilePicture} />
                    <AvatarFallback className={cn(avatarColor, "text-[10px]")}>{initials}</AvatarFallback>
                  </Avatar>
                  
                  {/* Inline List Rendering */}
                  <div className="flex-1 text-sm leading-relaxed">
                    <span className="font-semibold text-foreground mr-2">{userName}</span>
                    <span className="text-foreground/90">{comment.content}</span>
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
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
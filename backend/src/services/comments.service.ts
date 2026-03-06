import CommentModel from '../models/comments.model';
import TaskModel from '../models/task.model';
import { BadRequestException, NotFoundException } from '../utils/appError';

export const createCommentService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  userId: string,
  content: string
) => {
  // Verify task exists and belongs to workspace/project
  const task = await TaskModel.findOne({ _id: taskId, workspace: workspaceId, project: projectId });
  if (!task) {
    throw new NotFoundException('Task not found');
  }

  const comment = new CommentModel({
    content,
    taskId,
    workspaceId,
    createdBy: userId,
  });

  await comment.save();

  // Populate creator details so the frontend can show their avatar and name immediately
  await comment.populate('createdBy', '_id name profilePicture');

  return { comment };
};

export const getTaskCommentsService = async (workspaceId: string, taskId: string) => {
  const comments = await CommentModel.find({ taskId, workspaceId })
    .sort({ createdAt: -1 }) // Newest first
    .populate('createdBy', '_id name profilePicture');

  return { comments };
};


export const deleteCommentService = async (
  workspaceId: string,
  taskId: string,
  commentId: string,
  userId: string
) => {
  const comment = await CommentModel.findById(commentId);

  if (!comment) {
    throw new NotFoundException('Comment not found');
  }

  // Security checks: Make sure it belongs to the right workspace and task
  if (comment.workspaceId.toString() !== workspaceId || comment.taskId.toString() !== taskId) {
    throw new BadRequestException('Comment does not belong to this task or workspace');
  }

  // THE MOST IMPORTANT RULE: Only the creator can delete their own comment
  if (comment.createdBy.toString() !== userId.toString()) {
    throw new BadRequestException('You are not authorized to delete this comment');
  }

  await comment.deleteOne();

  return { message: 'Comment deleted successfully' };
};
import CommentModel from '../models/comments.model';
import TaskModel from '../models/task.model';
import { NotFoundException } from '../utils/appError';

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
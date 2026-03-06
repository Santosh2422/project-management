import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { createCommentSchema } from '../validation/comments.validation';
import { taskIdSchema } from '../validation/task.validation';
import { projectIdSchema } from '../validation/project.validation';
import { workspaceIdSchema } from '../validation/workspace.validation';
import { createCommentService, getTaskCommentsService, deleteCommentService } from '../services/comments.service';
import { HTTPSTATUS } from '../config/http.config';
import { z } from 'zod';

export const createCommentController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { content, taskId } = createCommentSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.projectId);

    // Note: Add your roleGuard here if you want to restrict who can comment!

    const { comment } = await createCommentService(workspaceId, projectId, taskId, userId, content);

    return res.status(HTTPSTATUS.CREATED).json({
      message: 'Comment added successfully',
      comment,
    });
  }
);

export const getTaskCommentsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const taskId = taskIdSchema.parse(req.params.taskId);

    const { comments } = await getTaskCommentsService(workspaceId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Comments fetched successfully',
      comments,
    });
  }
);

const commentIdSchema = z.string().trim().min(1, { message: 'Comment ID is required' });

export const deleteCommentController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const taskId = taskIdSchema.parse(req.params.taskId);
    const commentId = commentIdSchema.parse(req.params.commentId);

    // Call the service
    await deleteCommentService(workspaceId, taskId, commentId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Comment deleted successfully',
    });
  }
);
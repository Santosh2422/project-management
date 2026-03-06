import { Router } from 'express';
import {
  createCommentController,
  getTaskCommentsController,
} from '../controllers/comments.controller';

const commentRoutes = Router();

// Create a comment
// We pass taskId in the body (based on our Zod schema), so we just need project and workspace in the URL
commentRoutes.post(
  '/projects/:projectId/workspace/:workspaceId/create',
  createCommentController
);

// Get all comments for a specific task
// We need the taskId and workspaceId to fetch them securely
commentRoutes.get(
  '/task/:taskId/workspace/:workspaceId/all',
  getTaskCommentsController
);

export default commentRoutes;
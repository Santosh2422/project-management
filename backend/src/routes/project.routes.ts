import { Router } from 'express';
import {
  createProjectController,
  deleteProjectByIdAndWorkspaceIdController,
  getAllProjectsWorkspaceController,
  getProjectAnalyticsController,
  getProjectByIdAndWorkspaceIdController,
  getProjectMembersController,
  addProjectMemberController,
  removeProjectMemberController,
  updateProjectByIdAndWorkspaceIdController,
} from '../controllers/project.controller';

const projectRoutes = Router();

projectRoutes.post('/workspace/:workspaceId/create', createProjectController);

projectRoutes.get('/workspace/:workspaceId/all', getAllProjectsWorkspaceController);

projectRoutes.get('/:id/workspace/:workspaceId', getProjectByIdAndWorkspaceIdController);

projectRoutes.get('/:id/workspace/:workspaceId/analytics', getProjectAnalyticsController);

projectRoutes.put(
  '/:id/workspace/:workspaceId/update',
  updateProjectByIdAndWorkspaceIdController
);

projectRoutes.delete(
  '/:id/workspace/:workspaceId/delete',
  deleteProjectByIdAndWorkspaceIdController
);

projectRoutes.post(
  '/:id/workspace/:workspaceId/members/add',
  addProjectMemberController
);

projectRoutes.delete(
  '/:id/workspace/:workspaceId/members/remove/:memberId',
  removeProjectMemberController
);

projectRoutes.get(
  '/:id/workspace/:workspaceId/members',
  getProjectMembersController
);

export default projectRoutes;


import { Router } from 'express';
import {
  createSectionController,
  getProjectSectionsController,
  updateSectionController,
  deleteSectionController,
} from '../controllers/section.controller';

const sectionRoutes = Router();

sectionRoutes.post(
  '/projects/:projectId/workspace/:workspaceId/create',
  createSectionController
);

sectionRoutes.get(
  '/projects/:projectId/workspace/:workspaceId/all',
  getProjectSectionsController
);

sectionRoutes.put(
  '/:sectionId/projects/:projectId/workspace/:workspaceId/update',
  updateSectionController
);

sectionRoutes.delete(
  '/:sectionId/projects/:projectId/workspace/:workspaceId/delete',
  deleteSectionController
);

export default sectionRoutes;
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { createSectionSchema, updateSectionSchema, sectionIdSchema } from '../validation/section.validation';
import { projectIdSchema } from '../validation/project.validation';
import { workspaceIdSchema } from '../validation/workspace.validation';
import {
  createSectionService,
  getProjectSectionsService,
  updateSectionService,
  deleteSectionService,
} from '../services/section.service';
import { HTTPSTATUS } from '../config/http.config';

export const createSectionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = createSectionSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { section } = await createSectionService(workspaceId, projectId, name);

    return res.status(HTTPSTATUS.CREATED).json({
      message: 'Section created successfully',
      section,
    });
  }
);

export const getProjectSectionsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { sections } = await getProjectSectionsService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Sections fetched successfully',
      sections,
    });
  }
);

export const updateSectionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = updateSectionSchema.parse(req.body);
    const sectionId = sectionIdSchema.parse(req.params.sectionId);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { section } = await updateSectionService(workspaceId, projectId, sectionId, name);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Section updated successfully',
      section,
    });
  }
);

export const deleteSectionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const sectionId = sectionIdSchema.parse(req.params.sectionId);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    await deleteSectionService(workspaceId, projectId, sectionId);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Section and associated tasks deleted successfully',
    });
  }
);
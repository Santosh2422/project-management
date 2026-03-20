import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import {
  createProjectSchema,
  projectIdSchema,
  updatedProjectSchema,
} from '../validation/project.validation';
import { workspaceIdSchema } from '../validation/workspace.validation';
import { getMemberRoleWorkspace } from '../services/member.service';
import { roleGuard } from '../utils/roleGuard';
import { Permissions } from '../enums/role.enum';
import {
  createProjectService,
  deleteProjectByIdAndWorkspaceIdService,
  getProjectAnalyticsService,
  getProjectByIdAndWorkspaceIdService,
  getProjectMembersService,
  addProjectMemberService,
  removeProjectMemberService,
  updateProjectByIdAndWorkspaceIdService,
  getUserProjectsInWorkspaceService,
} from '../services/project.service';
import { z } from 'zod';
import { HTTPSTATUS } from '../config/http.config';

export const createProjectController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const body = createProjectSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_PROJECT]);
    const { project } = await createProjectService(userId, workspaceId, body);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Project created successfully',
      project,
    });
  }
);

export const getAllProjectsWorkspaceController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const { projects, totalProjectsCount, totalPages, skip } =
      await getUserProjectsInWorkspaceService(userId, workspaceId, pageSize, pageNumber);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Projects fetched successfully',
      projects,
      pagination: {
        totalProjectsCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    });
  }
);

export const getProjectByIdAndWorkspaceIdController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);
    const { project } = await getProjectByIdAndWorkspaceIdService(workspaceId, projectId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Project fetched successfully',
      project,
    });
  }
);

export const getProjectAnalyticsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const userId = req.user?._id;
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);
    const { analytics } = await getProjectAnalyticsService(projectId, workspaceId);
    return res.status(HTTPSTATUS.OK).json({
      message: 'Project analytics fetched successfully',
      analytics,
    });
  }
);

export const updateProjectByIdAndWorkspaceIdController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const body = updatedProjectSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_PROJECT]);
    const { project } = await updateProjectByIdAndWorkspaceIdService(
      workspaceId,
      projectId,
      body
    );
    return res.status(HTTPSTATUS.OK).json({
      message: 'Project updated successfully',
      project,
    });
  }
);

export const deleteProjectByIdAndWorkspaceIdController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const { role } = await getMemberRoleWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_PROJECT]);
    const { project } = await deleteProjectByIdAndWorkspaceIdService(
      workspaceId,
      projectId
    );
    return res.status(HTTPSTATUS.OK).json({
      message: 'Project deleted successfully',
      project,
    });
  }
);

export const addProjectMemberController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const memberId = z.string().parse(req.body.memberId);

    const { project } = await addProjectMemberService(workspaceId, projectId, memberId, userId as string);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Member added to project successfully',
      project,
    });
  }
);

export const removeProjectMemberController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);
    const memberId = z.string().parse(req.params.memberId);

    const result = await removeProjectMemberService(workspaceId, projectId, memberId, userId as string);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

export const getProjectMembersController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);

    const { members } = await getProjectMembersService(workspaceId, projectId);

    return res.status(HTTPSTATUS.OK).json({
      message: 'Project members fetched successfully',
      members,
    });
  }
);


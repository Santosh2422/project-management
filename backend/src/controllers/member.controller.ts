import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { z } from 'zod';
import { HTTPSTATUS } from '../config/http.config';
import { joinWorkspaceByInviteService, approveJoinRequestService, rejectJoinRequestService, getWorkspaceJoinRequestsService } from '../services/member.service';
import JoinRequestModel from '../models/join-request.model';
import { 
  NotFoundException, 
  UnauthorizedException,
  BadRequestException 
} from '../utils/appError';
import WorkspaceModel from '../models/workspace.model';
import RoleModel from '../models/roles-permission.model';
import MemberModel from '../models/member.model';
import { Roles } from '../enums/role.enum';

export const joinWorkspaceController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract inviteCode from req.body instead of req.params
    const inviteCode = z.string().parse(req.body.inviteCode);
    
    const userId = req.user?._id;

    // 2. Pass the extracted code to your service layer
    const { workspaceId, message, status } = await joinWorkspaceByInviteService(userId, inviteCode);

    return res.status(HTTPSTATUS.OK).json({
      message: message,
      workspaceId,
      status
    });
  }
);


export const approveJoinRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const ownerId = req.user?._id; // Provided by passportAuthenticationJWT

    // Just call the service and wait for the result
    const result = await approveJoinRequestService(ownerId as string, requestId);

    return res.status(HTTPSTATUS.OK).json({message: result.message});
  }
);

export const rejectJoinRequestController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Validate the requestId from the URL parameters
    const requestId = z.string().parse(req.params.requestId);
    
    // 2. Identify the logged-in user (Owner)
    const adminId = req.user?._id;

    // 3. Call the service to verify ownership and remove the request
    const { message } = await rejectJoinRequestService(adminId as string, requestId);

    // 4. Send success response
    return res.status(HTTPSTATUS.OK).json({
      message: message,
    });
  }
);


export const getWorkspaceJoinRequestsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Validate the workspaceId from the URL params
    const workspaceId = z.string().parse(req.params.workspaceId);
    
    // 2. Extract the current user (The Owner)
    const ownerId = req.user?._id;

    // 3. Call the service to get the list
    const requests = await getWorkspaceJoinRequestsService(
      ownerId as string, 
      workspaceId
    );

    // 4. Return the list of requests
    return res.status(HTTPSTATUS.OK).json(requests);
  }
);

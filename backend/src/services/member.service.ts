// Importing required enums, models, and utility classes
import { ErrorCodeEnum } from '../enums/error-code.enum';
import { Roles } from '../enums/role.enum';
import MemberModel from '../models/member.model';
import RoleModel from '../models/roles-permission.model';
import WorkspaceModel from '../models/workspace.model';
import JoinRequestModel from '../models/join-request.model';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../utils/appError';

// Function to get the role of a member in a specific workspace
export const getMemberRoleWorkspace = async (userId: string, workspaceId: string) => {
  // Fetch the workspace by its ID
  const workspace = await WorkspaceModel.findById(workspaceId);

  // Throw an error if the workspace is not found
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }

  // Find the member in the workspace and populate the role field
  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate('role');

  // Throw an error if the member is not part of the workspace
  if (!member) {
    throw new UnauthorizedException(
      'Your are not member of this workspace ',
      ErrorCodeEnum.AUTH_UNAUTHORIZED_ACCESS
    );
  }

  // Return the role of the member
  return { role: member.role?.name };
};

// Function to allow a user to join a workspace using an invite code
export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  // Find the workspace using the invite code
  const workspace = await WorkspaceModel.findOne({
    inviteCode,
  }).exec();

  // Throw an error if the workspace is not found or the invite code is invalid
  if (!workspace) {
    throw new NotFoundException('Invalid invite code or Workspace not found');
  }
  
  // Check if the user is already a member of the workspace
  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();

  // Throw an error if the user is already a member
  if (existingMember) {
    throw new BadRequestException('You are already member of this workspace');
  }

  // // Find the default role for new members (e.g., MEMBER role)
  // const role = await RoleModel.findOne({
  //   name: Roles.MEMBER,
  // });

  // // Throw an error if the role is not found
  // if (!role) {
  //   throw new NotFoundException('Role not found');
  // }

  // // Create a new member entry in the database
  // const newMember = new MemberModel({
  //   userId, // ID of the user joining the workspace
  //   workspaceId: workspace._id, // ID of the workspace
  //   role: role._id, // Role assigned to the user
  //   joinedAt: new Date(), // Timestamp of when the user joined
  // });

  // // Save the new member to the database
  // await newMember.save();

  // // Return the workspace ID and the role name of the new member
  // return { workspaceId: workspace._id, role: role.name };

  // 3. NEW: Check if there is already a PENDING request
  // We don't want the user to spam multiple requests
  const existingRequest = await JoinRequestModel.findOne({
    userId,
    workspaceId: workspace._id,
  });

  if (existingRequest) {
    // Instead of THROWING an error, we RETURN a peaceful message
    return { 
      message: "You have already sent a request to join this workspace. Please wait for the owner to approve it.",
      workspaceId: workspace._id,
      status: 'PENDING' 
    };
  }

  // 4. CHANGE: Instead of creating a MemberModel, create a JoinRequestModel
  const newRequest = new JoinRequestModel({
    userId,
    workspaceId: workspace._id,
    status: 'PENDING', // This is the "waiting room" status
  });

  await newRequest.save();

  // 5. Return a message telling the user they have to wait
  return { 
    message: "Request sent successfully. Waiting for owner approval.",
    workspaceId: workspace._id 
  };
};


export const approveJoinRequestService = async (ownerId: string, requestId: string) => {
  // 1. Find the request
  const joinRequest = await JoinRequestModel.findById(requestId);
  if (!joinRequest) {
    throw new NotFoundException('Join request not found');
  }

  // 2. Security Check: Ensure the person approving is the OWNER of the workspace
  const workspace = await WorkspaceModel.findById(joinRequest.workspaceId);
  if (!workspace || workspace.owner.toString() !== ownerId.toString()) {
    throw new UnauthorizedException('Only the workspace owner can approve requests');
  }

  // 3. Get the Member Role
  const role = await RoleModel.findOne({ name: Roles.MEMBER });
  if (!role) {
    throw new NotFoundException('Role not found');
  }

  // 4. Create the real member
  const newMember = new MemberModel({
    userId: joinRequest.userId,
    workspaceId: joinRequest.workspaceId,
    role: role._id,
    joinedAt: new Date(),
  });
  await newMember.save();

  // 5. Delete the request from the "Waiting Room"
  await JoinRequestModel.findByIdAndDelete(requestId);

  return { message: "Member approved and added to workspace" };
};


export const rejectJoinRequestService = async (ownerId: string, requestId: string) => {
  // 1. Find the request to know which workspace it belongs to
  const joinRequest = await JoinRequestModel.findById(requestId);
  if (!joinRequest) {
    throw new NotFoundException('Join request not found');
  }

  // 2. Fetch the workspace
  const workspace = await WorkspaceModel.findById(joinRequest.workspaceId);
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }

  // 3. SECURITY GATE: Ensure the person rejecting is the actual Owner
  if (workspace.owner.toString() !== ownerId.toString()) {
    throw new UnauthorizedException('Only the workspace owner can reject requests');
  }

  // 4. Delete the request
  await JoinRequestModel.findByIdAndDelete(requestId);

  return { message: 'Join request has been rejected and removed' };
};


export const getWorkspaceJoinRequestsService = async (
  ownerId: string, 
  workspaceId: string
) => {
  // 1. Verify the workspace exists
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }

  // 2. SECURITY CHECK: Is the person asking for the list the Owner?
  if (workspace.owner.toString() !== ownerId.toString()) {
    throw new UnauthorizedException('Only the owner can view join requests');
  }

  // 3. Fetch all PENDING requests for this workspace
  // We populate 'userId' to get the user's name and email for the UI
  const requests = await JoinRequestModel.find({ 
    workspaceId, 
    status: 'PENDING' 
  })
    .populate('userId', 'name email') 
    .sort({ createdAt: -1 }); // Newest requests first

  return requests;
};


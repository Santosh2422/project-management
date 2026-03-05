import { Router } from 'express';
import { joinWorkspaceController, approveJoinRequestController, rejectJoinRequestController, getWorkspaceJoinRequestsController } from '../controllers/member.controller';


const memberRoutes = Router();

memberRoutes.post('/workspace/join', joinWorkspaceController);

// Approve a member
memberRoutes.post("/workspace/approve/:requestId", approveJoinRequestController);

// Reject a member
memberRoutes.delete("/workspace/reject/:requestId", rejectJoinRequestController);

// Get the list of requests
memberRoutes.get("/workspace/:workspaceId/requests", getWorkspaceJoinRequestsController);

export default memberRoutes;


import { Router } from 'express';
import { joinWorkspaceController } from '../controllers/member.controller';

const memberRoutes = Router();

memberRoutes.post('/workspace/join', joinWorkspaceController);

export default memberRoutes;


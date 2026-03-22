import { Router } from 'express';
import { getCurrentUserController, updateUserController } from '../controllers/user.controller';

const userRoutes = Router();

userRoutes.get('/current', getCurrentUserController);
userRoutes.put('/update', updateUserController);

export default userRoutes;

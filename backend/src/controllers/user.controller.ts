// Import necessary types and modules
import { Request, Response } from 'express'; // Types from Express
import { asyncHandler } from '../middlewares/asyncHandler.middleware'; // Middleware to handle async errors
import { HTTPSTATUS } from '../config/http.config'; // HTTP status codes
import { getCurrentUserService, updateUserService } from '../services/user.service';

// Controller to get the current logged-in user
export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    // Extract the user ID from the request object
    const userId = req?.user?._id;

    // Fetch the current user details using the service
    const { user } = await getCurrentUserService(userId);

    // Return the response with HTTP status 200 (OK) and the user details
    return res.status(HTTPSTATUS.OK).json({
      message: 'User fetched successfully',
      user,
    });
  }
);

export const updateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req?.user?._id;
    const { name, password, currentPassword } = req.body;

    const { user } = await updateUserService(userId, { name, password, currentPassword });

    return res.status(HTTPSTATUS.OK).json({
      message: 'Profile updated successfully',
      user,
    });
  }
);


import UserModel from '../models/user.model';
import { BadRequestException } from '../utils/appError';

export const getCurrentUserService = async (userId: string) => {
  // Define the getCurrentUserService function
  const user = await UserModel.findById(userId) // Find the user by ID
    .populate('currentWorkspace') // Populate the current workspace
    .select('-password'); // Exclude the password field
  if (!user) {
    // If the user is not found
    throw new BadRequestException('User not found'); // Throw a BadRequestException
  }
  return { user };
};

export const updateUserService = async (
  userId: string,
  data: { name?: string; password?: string; currentPassword?: string }
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new BadRequestException('User not found');
  }

  // If changing password, verify the current password first
  if (data.password) {
    if (!data.currentPassword) {
      throw new BadRequestException('Current password is required to set a new password');
    }
    if (!user.password) {
      throw new BadRequestException('Cannot change password for OAuth accounts');
    }
    const isMatch = await user.comparePassword(data.currentPassword);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = data.password;
  }

  if (data.name) {
    user.name = data.name;
  }

  await user.save();

  const updatedUser = user.omitPassword();
  return { user: updatedUser };
};


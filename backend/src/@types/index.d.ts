// Import the UserDocument interface from the user model.
import { UserDocument } from '../models/user.model';

declare global {
  namespace Express {

    interface User extends UserDocument {
      _id?: any;
      jwt?: string;
    }

    interface Request {
      jwt?: string;
      user?: User;
      session?: any;
    }
  }
}
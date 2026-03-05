import mongoose, { Schema, Document } from 'mongoose';

// 1. Define the Interface (The "Rules" for TypeScript)
export interface IJoinRequest extends Document {
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

// 2. Create the Schema (The "Blueprint" for MongoDB)
const JoinRequestSchema = new Schema<IJoinRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Links to your User model
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace', // Links to your Workspace model
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// 3. Prevent duplicate requests 
// A user shouldn't be able to send 10 requests to the same workspace
JoinRequestSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

const JoinRequestModel = mongoose.model<IJoinRequest>('JoinRequest', JoinRequestSchema);

export default JoinRequestModel;